module ProjectMailOverride
  module Hooks
    puts "--- [ProjectMailOverride] IssueHook file loading ---"
    class IssueHook < Redmine::Hook::Listener
      def controller_issues_new_before_save(context = {})
        log_hook("controller_issues_new_before_save", context)
      end

      def controller_issues_new_after_save(context = {})
        log_hook("controller_issues_new_after_save", context)
        
        issue = context[:issue]
        return unless issue && issue.id

        project = issue.project
        return unless project && project.module_enabled?(:project_mail_override)

        setting = project.project_mail_setting
        return unless setting
        
        # Check if method exists (in case of missing migration)
        return unless setting.respond_to?(:send_notification_on_create?) && setting.send_notification_on_create?

        creator = issue.author
        if creator && creator.active?
          Rails.logger.info "[ProjectMailOverride] Sending creation notification to #{creator.login}"
          begin
            Mailer.issue_add(issue, [creator], []).deliver_now
            Rails.logger.info "[ProjectMailOverride] Notification delivered"
          rescue => e
            Rails.logger.error "[ProjectMailOverride] Error sending notification: #{e.message}"
          end
        end
      end

      private

      def log_hook(name, context)
        msg = "--- [ProjectMailOverride] #{name} hook triggered (Issue: #{context[:issue]&.id || 'new'}) ---"
        puts msg
        Rails.logger.info msg
      end
    end
  end
end
