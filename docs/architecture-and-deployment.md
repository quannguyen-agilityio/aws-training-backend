# AWS Serverless Architecture & Deploy-Build Flow

This document provides a comprehensive overview of the system architecture, synchronous and asynchronous execution flows, security and observability mechanisms, as well as the build and deployment pipeline for both the Frontend and Backend applications.

---

## 1. System Architecture Diagram

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                     HOSTING LAYER                                      │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │                        Amplify Hosting / Client Browser                          │  │
│  └──────────────────────────────────────────┬───────────────────────────────────────┘  │
└─────────────────────────────────────────────┼──────────────────────────────────────────┘
                                              │ 1. HTTP Request (JWT)
                                              ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                     SECURITY LAYER                                     │
│  ┌─────────────────────────────────────┐      ┌─────────────────────────────────────┐  │
│  │         Cognito User Pool           │      │            AWS IAM Roles            │  │
│  │   (JWT Token Generation & Auth)     │      │   (Least Privilege Execution Roles) │  │
│  └──────────────────┬──────────────────┘      └──────────────────┬──────────────────┘  │
└─────────────────────┼────────────────────────────────────────────┼─────────────────────┘
                      │ 2. Validate Token                          │ Execution Permissions
                      ▼                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                  API & COMPUTE LAYER                                   │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │                               Amazon API Gateway                                 │  │
│  │               (Authorization: Bearer <JWT> & Token Signature Validation)          │  │
│  └──────────────────────────────────────────┬───────────────────────────────────────┘  │
│                                             │ 5. Trigger Proxy Integration             │
│                                             ▼                                          │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │                              Lambda (Sync / Producer)                            │  │
│  │                          (Synchronous Business Logic)                            │  │
│  └──────┬───────────────────────────────────┬───────────────────────────────────────┘  │
└─────────┼───────────────────────────────────┼──────────────────────────────────────────┘
          │                                   │ 1. Enqueue Task (HTTP 202)
          │ 6. GetItem / Query / PutItem      ▼
          ▼                         ┌────────────────────────────────────────────────────┐
┌──────────────────┐                │               ASYNC MESSAGING PIPELINE             │
│  STORAGE LAYER   │                │  ┌──────────────────────────────────────────────┐  │
│  ┌────────────┐  │                │  │                  SQS Queue                   │  │
│  │  DynamoDB  │  │                │  │            (Load Leveling Buffer)            │  │
│  │   Table    │  │                │  └──────────────────────┬───────────────────────┘  │
│  └─────▲──────┘  │                │                         │ 3. ESM Batch Poll        │
└────────┼─────────┘                │                         ▼                          │
         │                          │  ┌──────────────────────────────────────────────┐  │
         │ 4a. Update Status        │  │           Lambda (Async / Consumer)          │  │
         └──────────────────────────┼──┤           (Heavy Background Worker)          │  │
                                    │  └──────────────────────┬───────────────────────┘  │
                                    │                         │ 4b. Publish Event        │
                                    │                         ▼                          │
                                    │  ┌──────────────────────────────────────────────┐  │
                                    │  │                  SNS Topic                   │  │
                                    │  └──────────────────────┬───────────────────────┘  │
                                    │                         │ 5. Trigger Email         │
                                    │                         ▼                          │
                                    │  ┌──────────────────────────────────────────────┐  │
                                    │  │              SES Email Service               │  │
                                    │  │            (Deliver User Email)              │  │
                                    │  └──────────────────────────────────────────────┘  │
                                    └────────────────────────────────────────────────────┘
                                              │
                                              │ Logs & Traces
                                              ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   OBSERVABILITY LAYER                                  │
│  ┌─────────────────────────────────────┐      ┌─────────────────────────────────────┐  │
│  │      CloudWatch Logs & Metrics      │      │          AWS X-Ray Tracing          │  │
│  │  (Centralized Logging & Insights)   │      │    (Distributed Request Trace ID)   │  │
│  └─────────────────────────────────────┘      └─────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Synchronous Flow

The synchronous flow is used for operations that require an instant response to the user (e.g., User Login, Fetching User Profile, Product Search, or Account Balance Check).

```text
[Client / Browser]
       │
       │ 1. Request static bundle
       ▼
[Amplify Hosting (S3 + CloudFront)]
       │
       │ 2. Submit credentials
       ▼
[Cognito User Pool] ────(Validate & return JWT Tokens)────► [Client]
                                                               │
       ┌───────────────────────────────────────────────────────┘
       │ 3. HTTP Request (Header: Authorization: Bearer <JWT>)
       ▼
[API Gateway] ───(4. Token Verification with Cognito)───► [Token Valid?]
       │                                                         │
       ├─── 401 Unauthorized (If Expired/Invalid)                │ Yes
       │                                                         ▼
       │                                               [Lambda Sync Worker]
       │                                                         │
       │                                                         │ 5. Execute AWS SDK
       │                                                         ▼
       │                                                 [DynamoDB Table]
       │                                                         │
       │                                                         │ 6. Single-digit ms data
       │                                                         ▼
       │                                               [Lambda Sync Worker]
       │ 7. HTTP 200 OK + JSON Payload                           │
       ◄─────────────────────────────────────────────────────────┘
```

### Flow Matrix

| Step  | Component / Action       | Source → Destination                                 | Description                                                                                                                            |
| :---: | :----------------------- | :--------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------- |
| **1** | Serve Frontend Assets    | Client $\rightarrow$ Amplify Hosting                 | Client accesses the web app. Amplify Hosting (S3 static storage + CloudFront CDN) rapidly delivers HTML, CSS, and JS assets.           |
| **2** | Identity Authentication  | Client $\rightarrow$ Cognito User Pool               | User submits login credentials. Cognito validates and returns JWT Tokens (ID Token, Access Token, Refresh Token).                      |
| **3** | API Request Entryway     | Client $\rightarrow$ API Gateway                     | Client attaches Access Token to HTTP header (`Authorization: Bearer <JWT>`) for endpoint actions (e.g., `GET /orders`).                |
| **4** | Token Verification       | API Gateway $\leftrightarrow$ Cognito                | API Gateway validates JWT signature. If invalid or expired, rejects request with `401 Unauthorized` without invoking Lambda.           |
| **5** | Business Logic Execution | API Gateway $\rightarrow$ Lambda Sync                | Upon successful validation, API Gateway triggers Lambda Sync Worker via Lambda Proxy Integration passing JSON event.                   |
| **6** | Database Operations      | Lambda Sync $\leftrightarrow$ DynamoDB               | Lambda Sync executes read/write commands (`GetItem`, `Query`, `PutItem`) directly against DynamoDB Table with single-digit ms latency. |
| **7** | HTTP Response Delivery   | Lambda Sync $\rightarrow$ APIGW $\rightarrow$ Client | Lambda returns formatted JSON payload to API Gateway. API Gateway responds with `200 OK + Data` to render on UI.                       |

---

## 3. Asynchronous Flow

The asynchronous flow handles heavy or slow background tasks (e.g., Payment Processing, Image Processing, PDF Report Generation, Email Receipts). This decouples system components, preventing client timeouts and UI freezing.

```text
[Client Browser]
       │
       │ Request Heavy Operation (e.g., "Place Order & Generate Invoice")
       ▼
[Lambda Sync Worker]
       │
       ├─────────────────────────────────────────┐
       │ 1. Input Validation & Push Task         │ 2. Immediate HTTP 202 Accepted
       ▼                                         ▼
  [SQS Queue]                            [Client Browser]
(Load Leveling Buffer)                    (UI remains responsive)
       │
       │ 3. AWS ESM Batch Poll (e.g., 10 msgs/batch)
       ▼
[Lambda Async Worker]
  (Background Worker)
       │
       ├─────────────────────────────────┐
       │ 4a. Update Status               │ 4b. Publish Success Event
       ▼                                 ▼
[DynamoDB Table]                   [SNS Topic]
(Status: PENDING ➔ COMPLETED)            │
                                         │ 5. Broadcast Event
                                         ▼
                                 [SES Email Service]
                                         │
                                         │ 6. Send HTML Receipt Email
                                         ▼
                                [User Email Inbox]
```

### Flow Matrix

|   Step    | Component / Action         | Source → Destination                           | Description                                                                                                      |
| :-------: | :------------------------- | :--------------------------------------------- | :--------------------------------------------------------------------------------------------------------------- |
|   **1**   | Push Task to Queue         | Lambda Sync $\rightarrow$ SQS Queue            | Performs basic validation and pushes task message containing order details into Amazon SQS Queue.                |
|   **2**   | Immediate Response         | Lambda Sync $\rightarrow$ Client               | Immediately returns `HTTP 202 Accepted` to client. SQS acts as a buffer (load leveler) absorbing traffic spikes. |
|   **3**   | Event Batching & Ingestion | SQS $\rightarrow$ Lambda Async                 | AWS Event Source Mapping (ESM) polls SQS in batches (e.g., 10 messages/batch) and invokes Lambda Async Worker.   |
|  **4a**   | State Mutation             | Lambda Async $\rightarrow$ DynamoDB            | Lambda Async updates order status from `PENDING` to `COMPLETED` in DynamoDB Table.                               |
|  **4b**   | Event Publishing           | Lambda Async $\rightarrow$ SNS Topic           | Upon task completion, Lambda Async publishes a success event to Amazon SNS Topic.                                |
| **5 & 6** | Email Delivery             | SNS $\rightarrow$ SES $\rightarrow$ User Email | SNS triggers Amazon SES (Simple Email Service) to generate and send HTML email receipt to user's inbox.          |

> [!IMPORTANT]
> **Critical Configuration Rule**: SQS Visibility Timeout must be configured to at least **6 times** the Lambda Async Timeout to prevent duplicate message processing.

---

## 4. Security & Observability Flow

```text
                       ┌─────────────────────────────────────────┐
                       │      API Gateway Trace ID Generator     │
                       │           (X-Amzn-Trace-Id)             │
                       └────────────────────┬────────────────────┘
                                            │ Propagates Trace ID
                                            ▼
 ┌─────────────────────────┐     ┌─────────────────────┐     ┌───────────────────────┐
 │  Sync Lambda IAM Role   │     │  Lambda Sync Worker │     │     DynamoDB Table    │
 │  - sqs:SendMessage      ├────►│  (Proxy Execution)  ├────►│ (Single-digit ms DB)  │
 │  - dynamodb:Read/Write  │     └──────────┬──────────┘     └───────────────────────┘
 └─────────────────────────┘                │ Enqueue Task
                                            ▼
 ┌─────────────────────────┐     ┌─────────────────────┐
 │  Async Lambda IAM Role  │     │      SQS Queue      │
 │  - sqs:Receive/Delete   │     └──────────┬──────────┘
 │  - dynamodb:UpdateItem  │                │ ESM Batch Ingest
 │  - sns:Publish          │                ▼
 └──────────┬──────────────┘     ┌─────────────────────┐     ┌───────────────────────┐
            │ Granted            │ Lambda Async Worker │     │       SNS Topic       │
            └───────────────────►│ (Background Process)├────►│  (Pub/Sub Event Bus)  │
                                 └──────────┬──────────┘     └───────────────────────┘
                                            │ Logs & Traces
                                            ▼
                       ┌─────────────────────────────────────────┐
                       │ CloudWatch Logs & X-Ray Distributed Map │
                       │    (Cross-log group Insights & Alarms)  │
                       └─────────────────────────────────────────┘
```

### Security & Observability Matrix

| Feature                         | AWS Service         | Implementation Details                                                                                                                             |
| :------------------------------ | :------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Least Privilege IAM (Sync)**  | AWS IAM             | Grants `sqs:SendMessage` to SQS Queue and Read/Write access (`GetItem`, `Query`, `PutItem`) to specific DynamoDB tables.                           |
| **Least Privilege IAM (Async)** | AWS IAM             | Grants `sqs:ReceiveMessage`, `sqs:DeleteMessage`, `sns:Publish` to SNS Topic, and `dynamodb:UpdateItem` in DynamoDB.                               |
| **Centralized Logging**         | CloudWatch Logs     | Standard output (`console.log`) and runtime metrics ingested into dedicated log groups in real time.                                               |
| **Log Analytics**               | CloudWatch Insights | Executes interactive SQL-like queries across multiple log groups simultaneously to filter `ERROR` events.                                          |
| **Operational Alarms**          | CloudWatch Alarms   | Sends SNS alerts to DevOps if Lambda error rate exceeds **5%** or SQS queue depth exceeds **1000 messages**.                                       |
| **Distributed Tracing**         | AWS X-Ray           | Propagates `X-Amzn-Trace-Id` across `APIGW` $\rightarrow$ `Sync Lambda` $\rightarrow$ `SQS` $\rightarrow$ `Async Lambda` $\rightarrow$ `DynamoDB`. |
| **Visual Dashboard**            | ServiceLens         | Combines CloudWatch Metrics, Logs, and X-Ray Traces into a visual Service Map highlighting latency bottlenecks.                                    |

---

## 5. Deploy & Build Flow

This section details the continuous integration, build, packaging, and deployment flow for both the **Frontend** web application and the **Backend** serverless functions.

```text
                         DEVELOPER SOURCE CODE PUSH
                                     │
              ┌──────────────────────┴──────────────────────┐
              │ Push to develop / staging branch            │
              ▼                                             ▼
   [FRONTEND CI/CD PIPELINE]                     [BACKEND PACKAGING PIPELINE]
 (.github/workflows/amplify-deploy.yml)              (backend/package.json)
              │                                             │
              ▼                                             ▼
  1. Setup Node.js v24                        1. Execute npm run build
              │                                             │
              ▼                                             ▼
  2. npm ci inside /frontend                  2. Build producer.zip & consumer.zip
              │                                             │
              ▼                                             ▼
  3. npm run build (Vite output dist/)        3. aws lambda update-function-code
              │                                             │
              ▼                                             ▼
  4. Compress to dist.zip                     4. Deploy Producer ➔ Sync Lambda
              │                                  Deploy Consumer ➔ Async Lambda
              ▼                                             │
  5. aws amplify create-deployment                          ▼
     PUT dist.zip to pre-signed URL           5. Configure SQS Event Source Mapping
              │                                  (Visibility Timeout >= 6x Lambda)
              ▼                                             │
  6. aws amplify start-deployment                           ▼
              │                                 [AWS Backend Infrastructure]
              ▼
   [AWS Amplify CloudFront CDN]
```

### 1. Frontend CI/CD & Amplify Hosting

The frontend deployment is fully automated using GitHub Actions (`.github/workflows/amplify-deploy.yml`).

#### Workflow Specifications

- **Triggers**: Automated push to `develop` or `staging` branches.
- **Environment Matrix**: Environment variables are scoped dynamically to `${{ github.ref_name }}`.

#### Build & Deployment Steps

1. **Checkout & Runtime Setup**: Checks out repository code and sets up Node.js v24 with `npm` caching configured against `frontend/package-lock.json`.
2. **Dependency Installation**: Executes `npm ci` inside the `frontend/` working directory for clean, deterministic builds.
3. **Application Build**: Runs `npm run build` using Vite, passing `VITE_API_ENDPOINT` from environment secret variables. The compiled production bundle is generated in `frontend/dist/`.
4. **Artifact Compression**: Compresses the `dist/` directory into `dist.zip`.
5. **AWS Authentication**: Authenticates with AWS using `aws-actions/configure-aws-credentials@v4` targeting region `ap-southeast-2`.
6. **Amplify Deployment Execution**:
   - Calls `aws amplify create-deployment` for the targeted AWS Amplify App ID and branch.
   - Uploads `dist.zip` directly to the provided pre-signed S3 upload URL via HTTP `PUT`.
   - Triggers `aws amplify start-deployment` to deploy the assets to CloudFront CDN edges.

---

### 2. Backend Build & Packaging

The backend consists of Node.js ES Module scripts (`producer.js` for the synchronous Producer/Sync Lambda, and `consumer.js` for the asynchronous Consumer/Async Lambda).

#### Package Scripts (`backend/package.json`)

```json
{
  "scripts": {
    "build": "zip -r producer.zip index.js producer.js package.json node_modules && zip -r consumer.zip consumer.js package.json node_modules",
    "build:producer": "zip -r producer.zip index.js producer.js package.json node_modules",
    "build:consumer": "zip -r consumer.zip consumer.js package.json node_modules"
  }
}
```

#### Artifact Output

- `producer.zip`: Contains `index.js`, `producer.js`, `package.json`, and `node_modules`. Deployed to the **Sync/Producer Lambda Function**.
- `consumer.zip`: Contains `consumer.js`, `package.json`, and `node_modules`. Deployed to the **Async/Consumer Lambda Function**.

---

### 3. Backend Infrastructure & Lambda Deployment

```bash
# 1. Install production dependencies
cd backend
npm install --omit=dev

# 2. Build deployment zips
npm run build

# 3. Deploy Producer (Sync) Lambda Code to AWS
aws lambda update-function-code \
  --function-name SyncProducerLambda \
  --zip-file fileb://producer.zip \
  --region ap-southeast-2

# 4. Deploy Consumer (Async) Lambda Code to AWS
aws lambda update-function-code \
  --function-name AsyncConsumerLambda \
  --zip-file fileb://consumer.zip \
  --region ap-southeast-2
```

#### Event Source & Integration Wiring Checklist

1. **SQS Event Source Mapping**:
   - Configure Event Source Mapping between the SQS Queue ARN and `AsyncConsumerLambda`.
   - Batch size: `10`.
   - **SQS Visibility Timeout**: Set to $\ge 6 \times \text{Lambda Async Timeout}$ (e.g., if Lambda timeout is 30s, SQS Visibility Timeout $\ge$ 180s).
2. **API Gateway Integration**:
   - Set up API Gateway REST API / HTTP API with Cognito User Pool Authorizer.
   - Configure Lambda Proxy Integration routing HTTP requests to `SyncProducerLambda`.
3. **Environment Variables**:
   - `SyncProducerLambda`: `SQS_QUEUE_URL`, `DYNAMODB_TABLE_NAME`.
   - `AsyncConsumerLambda`: `DYNAMODB_TABLE_NAME`, `SNS_TOPIC_ARN`.

---

### 4. Summary Matrix of Build & Deployment Artifacts

| Component            | Source Path            | Build Command            | Output Artifact | Target Service                        |
| :------------------- | :--------------------- | :----------------------- | :-------------- | :------------------------------------ |
| **Frontend**         | `/frontend`            | `npm run build`          | `dist.zip`      | AWS Amplify Hosting (S3 + CloudFront) |
| **Backend Producer** | `/backend/producer.js` | `npm run build:producer` | `producer.zip`  | AWS Lambda (Sync Worker)              |
| **Backend Consumer** | `/backend/consumer.js` | `npm run build:consumer` | `consumer.zip`  | AWS Lambda (Async Worker)             |
