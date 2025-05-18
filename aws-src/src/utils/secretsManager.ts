import AWS from 'aws-sdk';

const region = process.env.AWS_REGION || 'us-east-1';

AWS.config.update({ region });

const client = new AWS.SecretsManager();

export async function getSecret(secretName: string): Promise<string> {
  try {
    const data = await client.getSecretValue({ SecretId: secretName }).promise();
    if ('SecretString' in data && data.SecretString) {
      return data.SecretString;
    }
    throw new Error('SecretString not found');
  } catch (error) {
    throw new Error(`Unable to retrieve secret ${secretName}: ${error}`);
  }
}
