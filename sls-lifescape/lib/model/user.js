'use strict';

const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();

// DynamoDB Table Names
const USERS_TABLE = process.env.USERS_TABLE || 'Users';
const USER_FRIENDS_TABLE = process.env.USER_FRIENDS_TABLE || 'UserFriends';
const USER_FRIEND_REQUESTS_TABLE = process.env.USER_FRIEND_REQUESTS_TABLE || 'UserFriendRequests';

/**
 * Get user detail by user_id from DynamoDB
 * @param {string} user_id - User ID
 * @returns {Promise<Object>} User object or empty object if not found
 */
module.exports.getUserDetail = function(user_id) {
    return new Promise(function(resolve, reject) {
        if (!user_id || user_id === "") {
            resolve({});
            return;
        }

        var params = {
            TableName: USERS_TABLE,
            Key: {
                "user_id": user_id
            }
        };

        dynamo.get(params, function(error, result) {
            if (error) {
                console.error("Error getting user detail:", error);
                resolve({}); // Return empty object on error
                return;
            }

            if (result.Item) {
                resolve(result.Item);
            } else {
                resolve({}); // User not found
            }
        });
    });
};

/**
 * Get user friend IDs from DynamoDB
 * @param {string} user_id - User ID
 * @returns {Promise<Array>} Array of friend IDs
 */
module.exports.getUserFriendIDs = function(user_id) {
    return new Promise(function(resolve, reject) {
        if (!user_id || user_id === "") {
            resolve([]);
            return;
        }

        var params = {
            TableName: USER_FRIENDS_TABLE,
            KeyConditionExpression: "user_id = :user_id",
            ExpressionAttributeValues: {
                ":user_id": user_id
            }
        };

        dynamo.query(params, function(error, result) {
            if (error) {
                console.error("Error getting user friends:", error);
                resolve([]);
                return;
            }

            var friend_ids = [];
            if (result.Items && result.Items.length > 0) {
                friend_ids = result.Items.map(function(item) {
                    return item.friend_id;
                });
            }
            resolve(friend_ids);
        });
    });
};

/**
 * Get user friend details (multiple users)
 * @param {string} user_id - User ID
 * @returns {Promise<Object>} Object with friend_id as keys and user details as values
 */
module.exports.getUserFriendDetails = function(user_id) {
    return new Promise(async function(resolve, reject) {
        try {
            // First get friend IDs
            var friend_ids = await module.exports.getUserFriendIDs(user_id);
            
            if (friend_ids.length === 0) {
                resolve({});
                return;
            }

            // Get details for each friend
            var friends_obj = {};
            var promises = friend_ids.map(function(friend_id) {
                return module.exports.getUserDetail(friend_id).then(function(user_detail) {
                    if (Object.keys(user_detail).length > 0) {
                        friends_obj[friend_id] = user_detail;
                    }
                });
            });

            await Promise.all(promises);
            resolve(friends_obj);
        } catch (error) {
            console.error("Error getting user friend details:", error);
            resolve({});
        }
    });
};

/**
 * Search users by keyword (placeholder - can be enhanced with Elasticsearch)
 * @param {string} keyword - Search keyword
 * @returns {Promise<Array>} Array of matching users
 */
module.exports.searchUsers = function(keyword) {
    return new Promise(function(resolve, reject) {
        if (!keyword || keyword === "") {
            resolve([]);
            return;
        }

        // For now, return empty array
        // TODO: Implement search using Elasticsearch or DynamoDB scan with filters
        // This would require either:
        // 1. Elasticsearch integration (you have sls-elasticsearch service)
        // 2. DynamoDB GSI with searchable fields
        // 3. External search service
        
        console.log("User search not yet implemented. Keyword:", keyword);
        resolve([]);
    });
};

/**
 * Get friend status between two users
 * @param {string} user_id - User ID
 * @param {string} friend_id - Friend/Other user ID
 * @returns {Promise<Object|null>} Friend status object or null
 */
module.exports.getUserFriendManageStatus = function(user_id, friend_id) {
    return new Promise(function(resolve, reject) {
        if (!user_id || !friend_id || user_id === "" || friend_id === "") {
            resolve(null);
            return;
        }

        // Check if they are friends
        var params = {
            TableName: USER_FRIENDS_TABLE,
            Key: {
                "user_id": user_id,
                "friend_id": friend_id
            }
        };

        dynamo.get(params, function(error, result) {
            if (error) {
                console.error("Error checking friend status:", error);
                resolve(null);
                return;
            }

            if (result.Item) {
                resolve({ status: "friend", created_datetime: result.Item.created_datetime });
            } else {
                // Check for pending friend request
                var requestParams = {
                    TableName: USER_FRIEND_REQUESTS_TABLE,
                    Key: {
                        "user_id": user_id,
                        "to_user_id": friend_id
                    }
                };

                dynamo.get(requestParams, function(err, reqResult) {
                    if (err) {
                        console.error("Error checking friend request:", err);
                        resolve(null);
                        return;
                    }

                    if (reqResult.Item) {
                        resolve({ 
                            status: reqResult.Item.status || "pending",
                            created_datetime: reqResult.Item.created_datetime 
                        });
                    } else {
                        resolve(null); // No relationship
                    }
                });
            }
        });
    });
};

/**
 * Placeholder function for cleanup (no-op since we're not using Firebase)
 * @returns {null}
 */
module.exports.firebasedelete = function() {
    // No-op - Firebase removed
    return null;
};

