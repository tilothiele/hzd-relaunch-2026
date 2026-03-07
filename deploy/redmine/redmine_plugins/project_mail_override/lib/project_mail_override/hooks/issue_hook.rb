module ProjectMailOverride
  module Hooks
    puts "--- [ProjectMailOverride] IssueHook file loading ---"
    class IssueHook < Redmine::Hook::Listener
      def controller_issues_new_after_save(context = {})
        puts "--- [ProjectMailOverride] controller_issues_new_after_save hook triggered ---"
        issue = context[:issue]
        unless issue
          puts "--- [ProjectMailOverride] No issue in context ---"
          return
        end

        project = issue.project
        unless project
          puts "--- [ProjectMailOverride] Issue #{issue.id} has no project ---"
          return
        end

        puts "--- [ProjectMailOverride] Processing issue #{issue.id} in project #{project.identifier} ---"

        unless project.module_enabled?(:project_mail_override)
          puts "--- [ProjectMailOverride] Module not enabled for project ---"
          return
        end

        setting = project.project_mail_setting
        unless setting
          puts "--- [ProjectMailOverride] No mail setting found for project ---"
          return
        end

        puts "--- [ProjectMailOverride] send_notification_on_create: #{setting.send_notification_on_create} ---"
        return unless setting.send_notification_on_create?

        creator = issue.author
        if creator && creator.active?
          puts "--- [ProjectMailOverride] Sending notification to creator: #{creator.login} ---"
          begin
            # Redmine 6 uses deliver_now or just deliver depending on config
            # But let's check Rails 7 ActionMailer
            Mailer.issue_add(issue, [creator], []).deliver_now
            puts "--- [ProjectMailOverride] Notification delivered ---"
          rescue => e
            puts "--- [ProjectMailOverride] Error sending notification: #{e.message} ---"
            Rails.logger.error "[ProjectMailOverride] Error sending notification: #{e.message}"
          end
        else
          puts "--- [ProjectMailOverride] Creator not found or not active ---"
        end
      end
    end
  end
end
