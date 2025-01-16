# VCBoost



## Table of Contents
### About the project


#### Built With

This section should list any major frameworks/libraries used to bootstrap your project.

Node.js


### Getting started

#### To use the app directly 

Go to this link to go the our page website and use the product directly:

#### To build the project locally
This is an example of how you may give instructions on setting up your project locally. To get a local copy up and running follow these simple example steps.

##### Prerequisites

Download and install nvm:
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash

Download and install Node.js:
nvm install 22

Verify the Node.js version:
node -v # Should print "v22.13.0".
nvm current # Should print "v22.13.0".

Verify npm version:
npm -v # Should print "10.9.2".


##### Installation

Download the project using the following command and go to the project folder:
git clone https://github.com/Lironeee/Deckalyst.git


Then you need to install the dependencies using the following commands:

npm install next@latest react@latest react-dom@latest

Once you have done that, you need to define your environment variables. To do so, create a .env file and add it the following keys:
PDL_API_KEY= #to access people data labs data
HARMONIC_API_KEY= #to access harmonic ai data
OPENAI_API_KEY= #to access open ai models


Finally:
- run this command: npm run dev
- connect to the localhost

