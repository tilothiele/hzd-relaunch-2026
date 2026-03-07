# app/controllers/project_mail_settings_controller.rb

class ProjectMailSettingsController < ApplicationController
  before_action :find_project
  before_action :authorize

  def edit
    @mail_setting = @project.project_mail_setting || @project.build_project_mail_setting
  end

  def update
    @mail_setting = @project.project_mail_setting || @project.build_project_mail_setting

    if @mail_setting.update(mail_setting_params)
      flash[:notice] = 'Mail settings updated'
      redirect_to settings_project_path(@project, tab: 'mail_override')
    else
      render :edit
    end
  end

  private

  def find_project
    @project = Project.find(params[:project_id])
  end

  def mail_setting_params
    params.require(:project_mail_setting)
          .permit(:from_address, :reply_to_address)
  end
end