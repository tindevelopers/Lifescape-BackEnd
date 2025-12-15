// Simple test script to invoke function locally without Serverless Framework
// Usage: node test-local-invoke.js

const thread = require('./thread');
const fs = require('fs');

// Read event file
const event = JSON.parse(fs.readFileSync('./event/thread.json', 'utf8'));

// Create mock context
const context = {
    succeed: (result) => {
        console.log('✅ SUCCESS:');
        console.log(JSON.stringify(result, null, 2));
        process.exit(0);
    },
    fail: (error) => {
        console.error('❌ FAILED:');
        console.error(error);
        process.exit(1);
    },
    done: (error, result) => {
        if (error) {
            console.error('❌ ERROR:');
            console.error(error);
            process.exit(1);
        } else {
            console.log('✅ SUCCESS:');
            console.log(JSON.stringify(result, null, 2));
            process.exit(0);
        }
    },
    getRemainingTimeInMillis: () => 30000,
    functionName: 'createThread',
    functionVersion: '$LATEST',
    invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:createThread',
    memoryLimitInMB: '128',
    awsRequestId: 'test-request-id'
};

// Mock callback
const callback = (error, result) => {
    if (error) {
        console.error('❌ ERROR:');
        console.error(error);
        process.exit(1);
    } else {
        console.log('✅ SUCCESS:');
        try {
            const parsed = typeof result === 'string' ? JSON.parse(result) : result;
            console.log(JSON.stringify(parsed, null, 2));
        } catch (e) {
            console.log(result);
        }
        process.exit(0);
    }
};

console.log('🧪 Testing createThread function locally...\n');
console.log('📥 Event:', JSON.stringify(event, null, 2));
console.log('\n---\n');

// Invoke the function
try {
    thread.create(event, context, callback);
} catch (error) {
    console.error('❌ EXCEPTION:', error);
    process.exit(1);
}

