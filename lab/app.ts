import { App } from "aws-cdk-lib";
import { ApiStack } from "./stack";

new ApiStack(new App(), "lab-api");
