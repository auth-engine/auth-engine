import asyncio
import logging

from auth_engine.core.config import settings
from auth_engine.external_services.email.base import EmailProvider, EmailProviderConfig

logger = logging.getLogger(__name__)

try:
    import boto3
    from botocore.exceptions import BotoCoreError, ClientError
except ImportError:
    boto3 = None
    BotoCoreError = ClientError = Exception
    logger.warning("boto3 not installed. SESEmailProvider will not function correctly.")


class SESEmailProvider(EmailProvider):
    """Amazon SES email provider.

    Credentials are resolved in this order:
    1. Explicit "access_key_id:secret_access_key" passed via the config's api_key
       (used for per-tenant configs stored encrypted in the DB).
    2. The standard boto3 credential chain (IAM instance/role, env vars, shared
       credentials file). This is the preferred, key-less path when AuthEngine
       runs on AWS — no secrets to store or rotate.
    """

    def __init__(self, config: EmailProviderConfig) -> None:
        self.default_sender = config.from_email
        self.region = getattr(settings, "AWS_REGION", "ap-south-1")

        self._access_key: str | None = None
        self._secret_key: str | None = None
        if config.api_key and ":" in config.api_key:
            self._access_key, self._secret_key = config.api_key.split(":", 1)

    def _build_client(self):  # type: ignore[no-untyped-def]
        kwargs = {"region_name": self.region}
        if self._access_key and self._secret_key:
            kwargs["aws_access_key_id"] = self._access_key
            kwargs["aws_secret_access_key"] = self._secret_key
        return boto3.client("ses", **kwargs)

    def _send_sync(self, to_emails: list[str], subject: str, html_content: str) -> bool:
        client = self._build_client()
        client.send_email(
            Source=self.default_sender,
            Destination={"ToAddresses": to_emails},
            Message={
                "Subject": {"Data": subject, "Charset": "UTF-8"},
                "Body": {"Html": {"Data": html_content, "Charset": "UTF-8"}},
            },
        )
        return True

    async def send_email(self, to_emails: list[str], subject: str, html_content: str) -> bool:
        if boto3 is None:
            logger.error("boto3 is not installed. Cannot send email via SES.")
            return False

        try:
            await asyncio.to_thread(self._send_sync, to_emails, subject, html_content)
            logger.info(f"Email sent successfully via SES to {to_emails}")
            return True
        except (BotoCoreError, ClientError) as e:
            logger.error(f"Error sending email via SES: {str(e)}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error sending email via SES: {str(e)}")
            return False
