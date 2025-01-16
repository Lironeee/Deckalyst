# VCBoost
![VCBoost platform](image_platform.png)    






## Table of Contents
### About the project

Our AI-powered tool revolutionizes startup analysis by examining pitch decks and websites while enriching this data with insights from four robust sources: PredictLeads, SimilarWeb, Harmonic, and PeopleDataLabs. The result? A clear, actionable analysis that delivers a comprehensive 360-degree view of each startup.

##### Key Features

One-Pager Generation: Automatically creates a concise summary of a startup's strengths, weaknesses, and key metrics.

Startup Scoring: Provides a quantitative score based on multiple factors, offering a quick assessment of a startup's potential.

Interactive Analysis: Powered by a Retrieval-Augmented Generation (RAG) system, analysts can ask specific questions and receive tailored insights directly from the data.

##### Innovative Capabilities

CRM Integration: Detect if you've previously analyzed the same startup and compare startups directly within the tool.

Data Transparency: Every data point is clickable, allowing users to trace insights back to their original sources for full transparency.

Advanced Comparisons: Identify key metrics and patterns across startups to uncover future category leaders.

Portfolio Backtesting: Analyze historical data to identify success patterns and enhance decision-making.

##### Future Developments

Email Integration: Automatically analyze startup decks received via email and store results on your device.

Privacy-Focused Design: Utilize a local language model (LLM) for secure, offline interactions.

Enhanced Reliability: Cross-check data across multiple sources for superior accuracy and reliability.

##### Why It Matters

This tool empowers venture capital analysts to save time and make better decisions by streamlining startup evaluation. Its fast, accurate, and interactive approach ensures analysts can focus on identifying the most promising opportunities.

Use the BLANK_README.md to get started.


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

