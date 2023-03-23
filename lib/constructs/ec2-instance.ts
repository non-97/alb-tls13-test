import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as fs from "fs";
import * as path from "path";

export interface Ec2InstanceProps {
  vpc: cdk.aws_ec2.IVpc;
}

export class Ec2Instance extends Construct {
  readonly instance: cdk.aws_ec2.Instance;

  constructor(scope: Construct, id: string, props: Ec2InstanceProps) {
    super(scope, id);

    // User data
    const userDataParameter = fs.readFileSync(
      path.join(__dirname, "../../src/ec2/user_data_setting_httpd.sh"),
      "utf8"
    );
    const userDataSetting = cdk.aws_ec2.UserData.forLinux({
      shebang: "#!/bin/bash",
    });
    userDataSetting.addCommands(userDataParameter);

    // Security Group
    const sg = new cdk.aws_ec2.SecurityGroup(this, "Sg", {
      allowAllOutbound: true,
      vpc: props.vpc,
    });
    sg.addIngressRule(
      cdk.aws_ec2.Peer.ipv4(props.vpc.vpcCidrBlock),
      cdk.aws_ec2.Port.tcp(80)
    );

    // EC2 Instance
    this.instance = new cdk.aws_ec2.Instance(this, "Default", {
      machineImage: cdk.aws_ec2.MachineImage.fromSsmParameter(
        "/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-6.1-x86_64"
      ),
      instanceType: new cdk.aws_ec2.InstanceType("t3.micro"),
      vpc: props.vpc,
      vpcSubnets: props.vpc.selectSubnets({
        subnetGroupName: "Isolated",
      }),
      securityGroup: sg,
      blockDevices: [
        {
          deviceName: "/dev/xvda",
          volume: cdk.aws_ec2.BlockDeviceVolume.ebs(8, {
            volumeType: cdk.aws_ec2.EbsDeviceVolumeType.GP3,
          }),
        },
      ],
      propagateTagsToVolumeOnCreation: true,
      userData: userDataSetting,
    });
  }
}
