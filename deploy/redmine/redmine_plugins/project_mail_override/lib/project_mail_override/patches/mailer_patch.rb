module ProjectMailOverride
  module Patches
    module MailerPatch
      puts "--- [ProjectMailOverride] MailerPatch module loaded ---"
      def mail(headers = {}, &block)
        puts "--- [ProjectMailOverride] Mailer#mail called ---"
        project = headers[:project]
# ...

        if project
          setting = project.project_mail_setting

          if setting
            headers[:from] = setting.effective_from if setting.effective_from.present?
            headers[:reply_to] = setting.effective_reply_to if setting.effective_reply_to.present?
          end
        end

        super(headers, &block)
      end
    end
  end
end

# Check if ActionMailer is loaded
if defined?(Mailer)
  unless Mailer.included_modules.include?(ProjectMailOverride::Patches::MailerPatch)
    puts "--- [ProjectMailOverride] Prepending MailerPatch ---"
    Mailer.prepend(ProjectMailOverride::Patches::MailerPatch)
  end
else
  puts "--- [ProjectMailOverride] Mailer class not yet defined, deferring prepend ---"
  ActiveSupport.on_load(:action_mailer) do
    # Inside on_load, Mailer should be available soon or we can prepend to ActionMailer::Base
    # but Redmine's Mailer is better.
    puts "--- [ProjectMailOverride] ActionMailer on_load triggered, prepending to Mailer ---"
    Mailer.prepend(ProjectMailOverride::Patches::MailerPatch) unless Mailer.included_modules.include?(ProjectMailOverride::Patches::MailerPatch)
  end
end
