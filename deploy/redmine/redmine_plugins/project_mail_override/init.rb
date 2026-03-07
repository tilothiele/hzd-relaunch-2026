# plugins/project_mail_override/init.rb

puts "--- [ProjectMailOverride] init.rb loaded ---"
Rails.logger.info "[ProjectMailOverride] init.rb loaded"

Redmine::Plugin.register :project_mail_override do
  name 'Project Mail Override'
  author '<Tilo Thiele> t.thiele@hovawarte.com'
  description 'Override From and Reply-To per project'
  version '0.0.1'
  requires_redmine version_or_higher: '6.0.0'

  project_module :project_mail_override do
    permission :manage_project_mail_settings,
               { project_mail_settings: [:edit, :update] },
               require: :member
  end
end

# Add lib to load path
lib_dir = File.join(File.dirname(__FILE__), 'lib')
puts "--- [ProjectMailOverride] lib_dir: #{lib_dir} ---"
$LOAD_PATH.unshift(lib_dir) unless $LOAD_PATH.include?(lib_dir)

# Initialize hook
hook_file = File.join(lib_dir, 'project_mail_override', 'hooks', 'project_settings_hook.rb')
puts "--- [ProjectMailOverride] Checking hook_file: #{hook_file} exists? #{File.exist?(hook_file)} ---"

puts "--- [ProjectMailOverride] Requiring hook ---"
require "project_mail_override/hooks/project_settings_hook"
puts "--- [ProjectMailOverride] Hook path in $LOADED_FEATURES: #{$LOADED_FEATURES.grep(/project_settings_hook/).first} ---"

# Apply patches using on_load for better performance and reliability
ActiveSupport.on_load(:active_record) do
  puts "--- [ProjectMailOverride] active_record on_load ---"
  require "project_mail_override/patches/project_patch"
end

ActiveSupport.on_load(:action_mailer) do
  puts "--- [ProjectMailOverride] action_mailer on_load ---"
  require "project_mail_override/patches/mailer_patch"
end
