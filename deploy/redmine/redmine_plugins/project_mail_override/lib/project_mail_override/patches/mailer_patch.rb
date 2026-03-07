module ProjectMailOverride
  module Patches
    module MailerPatch
      puts "--- [ProjectMailOverride] MailerPatch module loaded ---"
      def mail(headers = {}, &block)
        puts "--- [ProjectMailOverride] Mailer#mail called ---"
        
        # Try to find project from headers or instance variable (Redmine convention)
        project = headers[:project] || @project
        
        if project
          setting = project.project_mail_setting
          if setting
            # Use lowercase keys for ActionMailer compatibility
            if setting.effective_from.present?
              puts "--- [ProjectMailOverride] Overriding FROM: #{setting.effective_from} ---"
              headers[:from] = setting.effective_from
            end
            
            if setting.effective_reply_to.present?
              puts "--- [ProjectMailOverride] Overriding REPLY_TO: #{setting.effective_reply_to} ---"
              headers[:reply_to] = setting.effective_reply_to
            end
          end
        else
          puts "--- [ProjectMailOverride] No project found in Mailer context ---"
        end

        # Call super which will do the reverse_merge! in Redmine's Mailer
        # If we set headers[:from], reverse_merge! should not overwrite it.
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
