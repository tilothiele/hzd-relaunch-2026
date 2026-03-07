class ProjectMailSettingsController < ApplicationController
  before_action :find_project
  before_action :authorize

  def update
    setting = @project.project_mail_setting || @project.build_project_mail_setting

    if setting.update(params.require(:project_mail_setting).permit(:from_address, :reply_to_address, :send_notification_on_create))
      flash[:notice] = 'Mail settings updated'
    end

    redirect_to settings_project_path(@project, tab: 'mail_override')
  end

  private

  def find_project
    @project = Project.find(params[:project_id])
  end
end