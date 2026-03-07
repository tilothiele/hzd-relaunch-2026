module ProjectMailOverride
  module Patches
    module MailerPatch
      puts "--- [ProjectMailOverride] MailerPatch module loaded ---"
      def mail(headers = {}, &block)
        puts "--- [ProjectMailOverride] Mailer#mail called ---"
        
        # Try to find project from various sources common in Redmine Mailer methods
        project = headers[:project]
        project ||= @project
        project ||= @issue.project if @issue.respond_to?(:project)
        project ||= @journal.project if @journal.respond_to?(:project)
        project ||= @journal.journalized.project if @journal && @journal.respond_to?(:journalized) && @journal.journalized.respond_to?(:project)
        project ||= @message.project if @message.respond_to?(:project)
        project ||= @wiki_content.project if @wiki_content.respond_to?(:project)
        
        if project
          puts "--- [ProjectMailOverride] Detected context project: #{project.identifier} ---"
          setting = project.project_mail_setting
          if setting
            # Aggressively override both Symbol and String keys to win against reverse_merge!
            if setting.effective_from.present?
              puts "--- [ProjectMailOverride] Overriding FROM: #{setting.effective_from} ---"
              headers[:from] = setting.effective_from
              headers['From'] = setting.effective_from
            end
            
            if setting.effective_reply_to.present?
              puts "--- [ProjectMailOverride] Overriding REPLY-TO: #{setting.effective_reply_to} ---"
              headers[:reply_to] = setting.effective_reply_to
              headers['Reply-To'] = setting.effective_reply_to
              headers['Reply-to'] = setting.effective_reply_to
            end
          end
        else
          puts "--- [ProjectMailOverride] FAILED to detect project context in Mailer#mail ---"
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
