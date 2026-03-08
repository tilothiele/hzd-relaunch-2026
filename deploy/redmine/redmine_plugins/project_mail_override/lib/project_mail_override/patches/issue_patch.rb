module ProjectMailOverride
  module Patches
    module IssuePatch
      puts "--- [ProjectMailOverride] IssuePatch module loaded ---"
      def self.prepended(base)
        base.class_eval do
          after_create_commit :send_project_mail_override_notification
        end
      end

      private

      def send_project_mail_override_notification
        puts "--- [ProjectMailOverride] send_project_mail_override_notification for Issue ##{id} ---"
        
        # Check if project and module is enabled
        unless project && project.module_enabled?(:project_mail_override)
          puts "--- [ProjectMailOverride] Project or module not enabled for Issue ##{id} ---"
          return
        end

        # Check setting
        setting = project.project_mail_setting
        unless setting
          puts "--- [ProjectMailOverride] No ProjectMailSetting record found for project #{project.identifier} ---"
          return
        end

        puts "--- [ProjectMailOverride] Setting send_notification_on_create is: #{setting.send_notification_on_create} ---"
        unless setting.send_notification_on_create?
          puts "--- [ProjectMailOverride] send_notification_on_create is FALSE, skipping ---"
          return
        end

        # Send notification to author
        if author && author.active?
          puts "--- [ProjectMailOverride] Triggering Mailer.issue_add for creator: #{author.login} ---"
          begin
            # Use self as the issue object
            Mailer.issue_add(self, [author], []).deliver_now
            puts "--- [ProjectMailOverride] Mailer.issue_add.deliver_now finished ---"
          rescue => e
            puts "--- [ProjectMailOverride] CRITICAL ERROR sending notification: #{e.message} ---"
            Rails.logger.error "[ProjectMailOverride] Error sending notification: #{e.message}"
          end
        else
          puts "--- [ProjectMailOverride] Author not found or not active: #{author&.login} ---"
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
