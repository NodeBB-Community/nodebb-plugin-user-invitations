<h1><i class="fa fa-check"></i> New User Invitation</h1><br>

<div class="row">
	<div class="col-lg-9">
		<div class="panel panel-default">
			<div class="panel-heading"><i class="fa fa-envelope-o "></i> Send Invites</div>
			<div class="panel-body">
				<div class="form-group col-sm-12">
					<div class="h5">Enter the emails you want to invite below, separated by commas.</div>
					<label for="new-user-invite-user">E-mails</label>
					<textarea id="new-user-invite-user" class="form-control" placeholder="email@example.com, email2@example.com"/></textarea>
					<br>
					<button class="btn btn-primary" id="new-user-invite-send">Send Invites</button>
				</div>
			</div>
		</div>
	</div>
</div>

<div class="row">
	<div class="col-lg-9">
		<div class="panel panel-default">
			<div class="panel-heading"><i class="fa fa-user"></i> Invited Users List</div>
			<div class="panel-body">
				<div class="h5">These users have been invited, but have not yet accepted their invitation.</div>
				<table id="users-container" class="table new-users"></table>
			</div>
		</div>
	</div>
	<div class="col-lg-3">
		<div class="panel panel-default">
			<div class="panel-heading">Bulk Actions</div>
			<div class="panel-body">
				<button class="btn btn-warning" id="bulk-uninvite">Uninvite All</button>
				<button class="btn btn-success" id="bulk-reinvite">Resend All</button>
			</div>
		</div>
	</div>
</div>

<div class="row">
    <div class="col-lg-9">
        <div class="panel panel-default">
            <div class="panel-heading"><i class="fa fa-check"></i> Invite Groups</div>
            <div class="panel-body">
                <p class="jumbotron bg-info">If you want to control permissions manually, you can set uninvited and invited groups below. This feature is still experimental and may have bugs.
				<br><br>
				Leaving both the groups blank will restrict forum registration to invited users only. (Recommended)</p>
                <form role="form" class="newuser-invitation-settings">
                    <div class="form-group col-xs-6">
						<label for="uninvitedGroup">Uninvited Group</label>
						<input type="text" id="uninvitedGroup" name="uninvitedGroup" title="Uninvited Group" class="form-control" placeholder="members">
					</div>
                    <div class="form-group col-xs-6">
						<label for="invitedGroup">Invited Group</label>
						<input type="text" id="invitedGroup" name="invitedGroup" title="Invited Group" class="form-control" placeholder="members">
					</div>
					<button class="btn btn-primary" id="save">Save Groups</button>
                </form>
            </div>
        </div>
    </div>
</div>

<style>
  @import url("../../plugins/nodebb-plugin-newuser-invitation/public/templates/admin/plugins/style.css");
</style>

<script src="../../plugins/nodebb-plugin-newuser-invitation/public/templates/admin/plugins/script.js"></script>
