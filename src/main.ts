import * as core from '@actions/core';
import github from '@actions/github';
import axios from 'axios';

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    let footer = {
      "type": "FactSet",
      "facts": [
          { "title": "📁 Repo: ", "value": github.context.repo.repo },
          { "title": "🧑‍💻 Actor: ", "value": github.context.actor}

      ]
    }

    const actions:any[] = [];

    const payload=github.context.payload;

    let text: string|undefined = undefined;
    if (payload.pull_request) {
      text=payload.pull_request.title+': '+payload.action;
      actions.push({
        "type": "Action.OpenUrl",
        "title": "View PR",
        "url": payload.pull_request.html_url
      });
    }

    if (payload.issue){
      text=payload.issue.title+': '+payload.action;
      actions.push({
        "type": "Action.OpenUrl",
        "title": "View Issue",
        "url": payload.issue.html_url
      });
    }

    if (text===undefined) 
      text=JSON.stringify(github.context.payload);
    
    sendMessage({
      "type": "message",
      "summary": github.context.eventName,
      "attachments": [
          {
              "contentType": "application/vnd.microsoft.card.adaptive",
              "contentUrl": null,
              "content": {
                  "type": "AdaptiveCard",
                  "version": "1.5",
                  "body": [
                    {
                      "type": "TextBlock",
                      "text": text,
                      "wrap": true
                  }
                  ],
                  "actions":actions,
              }
          }
      ]
  });
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}

async function sendMessage(message:any){
  const teamsLink=core.getInput('teamsSecret')
  if (teamsLink===undefined) {
    throw new Error("Teams webhook link is not set")
  }
  await axios.post(teamsLink , message )
}