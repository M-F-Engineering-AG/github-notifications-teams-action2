# GitHub Notifications Teams Action

Send issue and pull request notifications into Teams Channel using this GitHub
Action!

## How to Send Notifications to Teams

### Teams

- Add the **Incoming Webhook** app to a Team.
- Configure **Conectors** in the channel where you want to receive GitHub
  notifications.
- Copy the **URL** generated during the configuration process.

### Github

- Go to repository settings -> Secrets -> Actions
- Create new repository secret and paste **URL** provided by Teams

## Usage

Add this Action as a step to your project's GitHub Action Workflow file:

```yaml
- name: Send notification
  uses: M-F-Engineering-AG/github-notifications-teams-action2@main
  with:
    teamsSecret: ${{ secrets.TEAMS }}
```

Now, in your channel, you will receive a message with the following information
about your issue or pull request.
