<div class="row">
    <div class="col-lg-9">
        <div class="panel panel-default">
            <div class="panel-heading"><i class="fa fa-check"></i> New User Invitation</div>
            <div class="panel-body">
                <p>Enter a group name for uninvited users and invited users, or leave both the groups blank to only allow registrations from invited users.</p>
                <form role="form" class="newuser-invitation-settings">
                    <div class="form-group col-xs-6">
						<label for="uninvitedGroup">Uninvited Group</label>
						<input type="text" id="uninvitedGroup" name="uninvitedGroup" title="Uninvited Group" class="form-control" placeholder="members">
					</div>
                    <div class="form-group col-xs-6">
						<label for="invitedGroup">Invited Group</label>
						<input type="text" id="invitedGroup" name="invitedGroup" title="Invited Group" class="form-control" placeholder="members">
					</div>
                </form>
            </div>
        </div>
    </div>
    <div class="col-lg-3">
		<div class="panel panel-default">
			<div class="panel-heading">Control Panel</div>
			<div class="panel-body">
				<button class="btn btn-primary" id="save">Save Settings</button>
			</div>
		</div>
	</div>
</div>

<div class="row">
	<div class="col-lg-9">
		<div class="panel panel-default">
			<div class="panel-heading"><i class="fa fa-envelope-o "></i> Send Invite</div>
			<div class="panel-body">
				<div class="form-group col-sm-6">
					<label for="new-user-invite-user">E-mail</label>
					<input type="text" id="new-user-invite-user" class="form-control" placeholder="email@example.com"/>
					<br>
					<button class="btn btn-primary" id="new-user-invite-send">Send Invite</button>
				</div>
			</div>
		</div>
	</div>
</div>

<div class="row">
	<div class="col-lg-9">
		<div class="panel panel-default">
			<div class="panel-heading"><i class="fa fa-user"></i> Invited Users</div>
			<div class="panel-body">
				    <ul id="users-container" class="new-users">
				</ul>
			</div>
		</div>
	</div>
</div>

<style>
  @import url("/plugins/nodebb-plugin-newuser-invitation/public/templates/admin/plugins/style.css");
</style>

<script src="/plugins/nodebb-plugin-newuser-invitation/public/templates/admin/plugins/script.js"></script>