import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export interface DomainSettingsProps {
  zoneName: string;
}

export class DomainSettings extends Construct {
  readonly publicHostedZone: cdk.aws_route53.IPublicHostedZone;
  readonly certificate: cdk.aws_certificatemanager.ICertificate;

  constructor(scope: Construct, id: string, props: DomainSettingsProps) {
    super(scope, id);

    // Public Hosted Zone
    this.publicHostedZone = new cdk.aws_route53.PublicHostedZone(
      this,
      "Public Hosted Zone",
      {
        zoneName: props.zoneName,
      }
    );

    // Certificate
    this.certificate = new cdk.aws_certificatemanager.Certificate(
      this,
      "Certificate",
      {
        domainName: props.zoneName,
        validation: cdk.aws_certificatemanager.CertificateValidation.fromDns(
          this.publicHostedZone
        ),
      }
    );
  }
}
