import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';


export class CdkVpcDemoStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    
    interface vpcContext {
      availability_zones: string[];
      private_subnet_cidrs: string[];
      public_subnet_cidrs: string[];
      vpc_cidr: string;
    }

    const vpc_context = this.node.tryGetContext('vpc') as vpcContext;

    const vpc = new ec2.Vpc(this, 'Vpc', {
      availabilityZones: vpc_context.availability_zones,
      cidr: vpc_context.vpc_cidr,
      createInternetGateway: false,
      natGateways: 0,
      subnetConfiguration: []
    });

    const internet_gateway = new ec2.CfnInternetGateway(this, 'InternetGateway', {
      tags: [{
        key: 'Name',
        value: 'InternetGateway'
      }]
    });

    const internet_gateway_attachment = new ec2.CfnVPCGatewayAttachment(this, 'InternetGatewayAttachment', { 
      internetGatewayId: internet_gateway.attrInternetGatewayId,
      vpcId: vpc.vpcId
    });

    const private_subnets = vpc_context.availability_zones.map((az, index) => {
      return new ec2.PrivateSubnet(this, `PrivateSubnet${index}`, {
        availabilityZone: az,
        cidrBlock: vpc_context.private_subnet_cidrs[index],
        mapPublicIpOnLaunch: false,
        vpcId: vpc.vpcId
      });
    });

    const public_subnets = vpc_context.availability_zones.map((az, index) => {
      return new ec2.PublicSubnet(this, `PublicSubnet${index}`, {
        availabilityZone: az,
        cidrBlock: vpc_context.public_subnet_cidrs[index],
        mapPublicIpOnLaunch: true,
        vpcId: vpc.vpcId
      });
    });

    const nat_gateway_eips = public_subnets.map((subnet, index) => {
      return new ec2.CfnEIP(this, `NatGatewayEIP${index}`, {
        domain: 'vpc',
        tags: [{
          key: 'Name',
          value: `NatGatewayEIP${index}`
        }]
      })
    });

    const nat_gateways = public_subnets.map((subnet, index) => {
      return new ec2.CfnNatGateway(this, `NatGateway${index}`, {
        allocationId: nat_gateway_eips[index].attrAllocationId,
        connectivityType: 'public',
        subnetId: subnet.subnetId,
        tags: [{
          key: 'Name',
          value: `NatGateway${index}`
        }]
      });
    });

    nat_gateways.forEach((gateway, index) => {
      gateway.node.addDependency(vpc);
      gateway.node.addDependency(nat_gateway_eips[index]);
    });

    const nat_gateway_routes = private_subnets.map((subnet, index) => {
      return new ec2.CfnRoute(this, `NatGatewayRoute${index}`, {
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: nat_gateways[index].attrNatGatewayId,
        routeTableId: subnet.routeTable.routeTableId
      });
    });
  }
}