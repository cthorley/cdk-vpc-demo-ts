# cdk-vpc-demo-ts

This CDK project demonstrates the creation of a simple, secure, highly available VPC.  The approach is explicit, rather than relying on the [`Vpc`](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ec2.Vpc.html) construct's conveniences.

To deploy a VPC with `cdk-vpc-demo-ts`, modify the values in `cdk.json`'s `.context.vpc` property to taste.  The stack expects that the length of all the arrays in `vpc` are equal.  A public NAT Gateway will be created in every availablility zone, and a route will be added to the corresponding private subnet's route table.