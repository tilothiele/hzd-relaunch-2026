module ProjectMailOverride
  module Hooks
    class IssueHook < Redmine::Hook::Listener
      def controller_issues_new_after_save(context = {})
        issue = context[:issue]
        return unless issue

        project = issue.project
        return unless project && project.module_enabled?(:project_mail_override)

        setting = project.project_mail_setting
        return unless setting && setting.send_notification_on_create?

        creator = issue.author
        if creator && creator.active?
          # Standard Mailer.issue_add sends to an array of users
          Mailer.issue_add(issue, [creator], []).deliver
        end
      end
    end
  end
end
