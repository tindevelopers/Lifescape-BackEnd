# Cognito Configuration

## Required Values

### ✅ Cognito User Pool ID
```
us-east-1_uFR3CWkSg
```
**Pool Name:** lifescape  
**Created:** 2019-08-05

### ✅ App Client ID
```
4590eqn44aignshvnci9oo7al7
```
**Client Name:** lifescapedev

**Note:** There are multiple App Clients available:
- `4590eqn44aignshvnci9oo7al7` - lifescapedev (recommended for development)
- `682rhi0vfnp6sc6s1782o4punj` - test
- `74nsnhtmc6qfhbqr9g2olsh6ip` - AWSElasticsearch-lifescape-us-east-1-l5nfd32jewdwtpbyk7qho5uare

### ✅ AWS Region
```
us-east-1
```

## Environment Variables

Set these environment variables in your Lambda functions or serverless.yml:

```bash
export COGNITO_USER_POOL_ID=us-east-1_uFR3CWkSg
export COGNITO_USER_POOL_CLIENT_ID=4590eqn44aignshvnci9oo7al7
export AWS_REGION=us-east-1
```

## Serverless.yml Configuration

Add to your `provider.environment` section:

```yaml
provider:
  environment:
    COGNITO_USER_POOL_ID: us-east-1_uFR3CWkSg
    COGNITO_USER_POOL_CLIENT_ID: 4590eqn44aignshvnci9oo7al7
    AWS_REGION: us-east-1
```

## Verification

To verify these values are correct, you can run:

```bash
# List User Pools
aws cognito-idp list-user-pools --max-results 10 --region us-east-1 --profile lifescape

# List App Clients for the User Pool
aws cognito-idp list-user-pool-clients \
  --user-pool-id us-east-1_uFR3CWkSg \
  --region us-east-1 \
  --profile lifescape
```

## Next Steps

1. ✅ User Pool ID: `us-east-1_uFR3CWkSg`
2. ✅ App Client ID: `4590eqn44aignshvnci9oo7al7`
3. ✅ AWS Region: `us-east-1`

You can now proceed with configuring your Lambda functions and API Gateway authorizers to use these Cognito values.
