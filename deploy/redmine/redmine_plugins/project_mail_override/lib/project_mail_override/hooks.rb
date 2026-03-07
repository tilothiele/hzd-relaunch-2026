module ProjectMailOverride
  class ProjectSettingsHook < Redmine::Hook::ViewListener
    render_on :view_projects_settings_tabs, partial: 'project_mail_settings/form', locals: {}
  end
end