'use strict';

const AWS = require('aws-sdk');

// Initialize SES client
const ses = new AWS.SES({ region: process.env.AWS_REGIONNAME || 'us-east-1' });

/**
 * Send email using AWS SES
 * @param {string} to - Recipient email address
 * @param {string} from - Sender email address (must be verified in SES)
 * @param {string} subject - Email subject
 * @param {string} textBody - Plain text email body
 * @param {string} htmlBody - HTML email body (optional)
 * @returns {Promise} Promise that resolves with SES send result
 */
module.exports.sendEmail = function(to, from, subject, textBody, htmlBody) {
    return new Promise(function(resolve, reject) {
        if (!to || !from || !subject || !textBody) {
            reject(new Error('Missing required email parameters: to, from, subject, textBody'));
            return;
        }

        var params = {
            Destination: {
                ToAddresses: Array.isArray(to) ? to : [to]
            },
            Message: {
                Body: {
                    Text: {
                        Charset: 'UTF-8',
                        Data: textBody
                    }
                },
                Subject: {
                    Charset: 'UTF-8',
                    Data: subject
                }
            },
            Source: from
        };

        // Add HTML body if provided
        if (htmlBody) {
            params.Message.Body.Html = {
                Charset: 'UTF-8',
                Data: htmlBody
            };
        }

        ses.sendEmail(params, function(error, data) {
            if (error) {
                console.error('SES sendEmail error:', error);
                reject(error);
            } else {
                console.log('SES email sent successfully:', data.MessageId);
                resolve(data);
            }
        });
    });
};

/**
 * Send templated email using AWS SES (for future use with SES templates)
 * @param {string} to - Recipient email address
 * @param {string} from - Sender email address
 * @param {string} templateName - SES template name
 * @param {Object} templateData - Template data object
 * @returns {Promise} Promise that resolves with SES send result
 */
module.exports.sendTemplatedEmail = function(to, from, templateName, templateData) {
    return new Promise(function(resolve, reject) {
        if (!to || !from || !templateName) {
            reject(new Error('Missing required parameters: to, from, templateName'));
            return;
        }

        var params = {
            Destination: {
                ToAddresses: Array.isArray(to) ? to : [to]
            },
            Source: from,
            Template: templateName,
            TemplateData: JSON.stringify(templateData || {})
        };

        ses.sendTemplatedEmail(params, function(error, data) {
            if (error) {
                console.error('SES sendTemplatedEmail error:', error);
                reject(error);
            } else {
                console.log('SES templated email sent successfully:', data.MessageId);
                resolve(data);
            }
        });
    });
};

