module ProjectMailOverride
  module Patches
    module IssuePatch
      def self.prepended(base)
        base.class_eval do
          after_create_commit :send_project_mail_override_notification
        end
      end

      private

      def send_project_mail_override_notification
        # Check if project and module is enabled
        return unless project && project.module_enabled?(:project_mail_override)

        # Check setting
        setting = project.project_mail_setting
        return unless setting && setting.send_notification_on_create?

        # Send notification to author
        if author && author.active?
          Rails.logger.info "[ProjectMailOverride] Sending creation notification for Issue ##{id} to #{author.login}"
          begin
            # Use self as the issue object
            Mailer.issue_add(self, [author], []).deliver_now
            Rails.logger.info "[ProjectMailOverride] Notification delivered"
          rescue => e
            Rails.logger.error "[ProjectMailOverride] Error sending notification: #{e.message}"
          end
        end
      end
    end
  end
end

# Ensure it's prepended
unless Issue.included_modules.include?(ProjectMailOverride::Patches::IssuePatch)
  puts "--- [ProjectMailOverride] Prepending IssuePatch ---"
  Issue.prepend(ProjectMailOverride::Patches::IssuePatch)
end
