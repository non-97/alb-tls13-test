import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export interface AlbProps {
  vpc: cdk.aws_ec2.IVpc;
  publicHostedZone: cdk.aws_route53.IPublicHostedZone;
  certificate: cdk.aws_certificatemanager.ICertificate;
  targetInstance: cdk.aws_ec2.Instance;
}

export class Alb extends Construct {
  constructor(scope: Construct, id: string, props: AlbProps) {
    super(scope, id);

    // Access Log S3 Bucket
    const accessLogBucket = new cdk.aws_s3.Bucket(this, "Access Log Bucket", {
      bucketName: "alb-access-log-non-97",
      encryption: cdk.aws_s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: new cdk.aws_s3.BlockPublicAccess({
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      }),
      enforceSSL: true,
      autoDeleteObjects: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Security Group
    const sg = new cdk.aws_ec2.SecurityGroup(this, "Sg", {
      vpc: props.vpc,
    });
    sg.addIngressRule(cdk.aws_ec2.Peer.anyIpv4(), cdk.aws_ec2.Port.tcp(443));
    sg.addEgressRule(
      cdk.aws_ec2.Peer.ipv4(props.vpc.vpcCidrBlock),
      cdk.aws_ec2.Port.tcp(80)
    );

    // ALB
    const alb = new cdk.aws_elasticloadbalancingv2.ApplicationLoadBalancer(
      this,
      "Default",
      {
        vpc: props.vpc,
        internetFacing: true,
        securityGroup: sg,
      }
    );
    alb.logAccessLogs(accessLogBucket);

    // Listener
    const listener = alb.addListener("Listener", {
      port: 443,
      certificates: [props.certificate],
      protocol: cdk.aws_elasticloadbalancingv2.ApplicationProtocol.HTTPS,
      sslPolicy: cdk.aws_elasticloadbalancingv2.SslPolicy.RECOMMENDED_TLS,
    });

    // Target
    listener.addTargets("Targets", {
      targets: [
        new cdk.aws_elasticloadbalancingv2_targets.InstanceTarget(
          props.targetInstance,
          80
        ),
      ],
      protocol: cdk.aws_elasticloadbalancingv2.ApplicationProtocol.HTTP,
      port: 80,
    });

    // Alias
    new cdk.aws_route53.ARecord(this, "Alias Record", {
      zone: props.publicHostedZone,
      target: cdk.aws_route53.RecordTarget.fromAlias(
        new cdk.aws_route53_targets.LoadBalancerTarget(alb)
      ),
    });
  }
}
