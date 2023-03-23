import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { Vpc } from "./constructs/vpc";
import { Ec2Instance } from "./constructs/ec2-instance";
import { DomainSettings } from "./constructs/domain-settings";
import { Alb } from "./constructs/alb";

export class AlbStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Public Host Zone and ACM Certificate
    const zoneName = "alb.non-97.net";
    const domainSettings = new DomainSettings(this, "Domain Settings", {
      zoneName,
    });

    // VPC
    const vpc = new Vpc(this, "Vpc");

    // EC2 Instance
    const ec2Instance = new Ec2Instance(this, "Ec2 Instance", {
      vpc: vpc.vpc,
    });

    // ALB
    new Alb(this, "Alb", {
      vpc: vpc.vpc,
      publicHostedZone: domainSettings.publicHostedZone,
      certificate: domainSettings.certificate,
      targetInstance: ec2Instance.instance,
    });
  }
}
