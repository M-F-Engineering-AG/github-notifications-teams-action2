import * as core from '@actions/core'
import * as github from '@actions/github'
import axios from 'axios'

const context = github.context
const payload = context.payload

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const actions: any[] = []
    const body: any[] = []
    const eventName = context.eventName

    console.log('Event Name: ' + context.eventName)

    let summary = `${eventName} / ${payload.action}`
    let addSummaryToBody = true

    function addIssue() {
      if (payload.issue == null) return
      body.push(textBlock(`Issue Title: **${payload.issue.title}**`))
      body.push(textBlock(`Issue Body: ${payload.issue.body}`))
      actions.push({
        type: 'Action.OpenUrl',
        title: 'View Issue',
        url: payload.issue.html_url
      })
    }

    function addPr() {
      if (payload.pull_request) {
        body.push(textBlock(`Pull Request ${payload.pull_request.title}**`))
        actions.push({
          type: 'Action.OpenUrl',
          title: 'View PR',
          url: payload.pull_request.html_url
        })
      }
    }

    if (eventName == 'push') {
      summary = `Push to ${payload.ref}`
      addSummaryToBody = false
      body.push(
        textBlock(
          `Push **${payload.head_commit?.message}** to **${payload.ref}** by **${payload.pusher?.name}**`
        )
      )
      actions.push({
        type: 'Action.OpenUrl',
        title: 'View Commit',
        url: payload.head_commit.url
      })
    } else if (eventName == 'issue_comment') {
      summary = `Comment ${payload.action} on ${payload.issue?.title}`
      addSummaryToBody = false
      body.push(
        textBlock(
          `Comment ${payload.action} on **${payload.issue?.title}** by **${payload.comment?.user.login}**`
        )
      )
      body.push(textBlock('Body: ' + payload.comment?.body))
      actions.push({
        type: 'Action.OpenUrl',
        title: 'View Comment',
        url: payload.comment?.html_url
      })
    } else if (eventName == 'issues' && payload.action == 'labeled') {
      summary = `Issue labeled with **${payload.label?.name}**: **${payload.issue?.title}** `
      addIssue()
    } else if (eventName == 'issues' && payload.action == 'assigned') {
      summary = `Issue assigned to **${payload.assignee?.login}**: **${payload.issue?.title}**`
      addIssue()
    } else if (eventName == 'issues' && payload.action == 'opened') {
      summary = `Issue created by **${payload.issue?.user?.login}**: **${payload.issue?.title}** `
      addIssue()
    } else if (eventName == 'workflow_run') {
      if (payload.action !== 'completed') return

      summary = `${payload.workflow_run?.name} **${payload.workflow_run?.conclusion}**: ${payload.workflow_run?.display_title}: `
      actions.push({
        type: 'Action.OpenUrl',
        title: 'View Workflow',
        url: payload.workflow_run.html_url
      })
    } else if (
      eventName == 'pull_request_review' &&
      payload.action == 'submitted' &&
      payload.review?.state == 'commented'
    ) {
      summary = `Comment on PR **${payload.pull_request?.title}** by **${payload.sender?.login}**`
      actions.push({
        type: 'Action.OpenUrl',
        title: 'View Comment',
        url: payload.review?.html_url
      })
    } else if (eventName == 'pull_request_review_comment') {
      return
    } else {
      addPr()
      addIssue()
    }

    if (addSummaryToBody) {
      body.push(textBlock(summary))
    }

    await sendMessage({
      type: 'message',
      summary: summary.replaceAll('**', ''),
      attachments: [
        {
          contentType: 'application/vnd.microsoft.card.adaptive',
          contentUrl: null,
          content: {
            type: 'AdaptiveCard',
            version: '1.5',
            body: body,
            actions: actions
          }
        }
      ]
    })

    console.log('Message sent')
  } catch (error) {
    console.log(error)
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  } finally {
    console.log(JSON.stringify(context.payload))
  }
}

async function sendMessage(message: any) {
  const teamsLink = core.getInput('teamsSecret')
  if (teamsLink === undefined) {
    throw new Error('Teams webhook link is not set')
  }
  var response = await axios.post(teamsLink, message)
  if (response.status !== 200) {
    throw new Error('Failed to send message to Teams')
  }
}

function textBlock(text: string) {
  return {
    type: 'TextBlock',
    text: text,
    wrap: true
  }
}
