#!/bin/bash
gcloud functions deploy authorize --allow-unauthenticated --runtime=nodejs12 --trigger-http  --entry-point=authorize --region=us-central1 --source=. &
gcloud functions deploy get-auth-tokens --allow-unauthenticated --runtime=nodejs12 --trigger-http  --entry-point=getAuthTokens --region=us-central1 --source=. &
gcloud functions deploy get-analytics-accounts-list --allow-unauthenticated --runtime=nodejs12 --trigger-http  --entry-point=getAnalyticsAccountsList --region=us-central1 --source=. &
gcloud functions deploy get-tagmanager-accounts-list --allow-unauthenticated --runtime=nodejs12 --trigger-http  --entry-point=getTagmanagerAccountsList --region=us-central1 --source=. &