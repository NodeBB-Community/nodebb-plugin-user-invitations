<div class="panel panel-default">
	<div class="panel-heading"><i class="fa fa-cog"></i> Your Invitations</div>
	<div class="panel-body">
		<div class="form-group col-sm-12">
			<form id="userinvitations">
				<strong>[[invite:your-available-invites]]:</strong> {invites.available}
				<br>
				<strong>[[invite:your-pending-invites]]:</strong> {invites.pending}
				<br>
				<strong>[[invite:your-accepted-invites]]:</strong> {invites.accepted}
			</form>
		</div>
	</div>
</div>
<div class="panel panel-default">
	<div class="panel-heading"><i class="fa fa-envelope-o"></i> [[invite:send-invites]]</div>
	<div class="panel-body">
		<div class="form-group col-sm-12">
			<div class="h5">[[invite:emails-info]]</div>
			<label for="new-user-invite-user">[[invite:emails]]</label>
			<textarea id="new-user-invite-user" class="form-control" placeholder="[[invite:email-placeholder]]"/></textarea>
			<br>
			<button class="btn btn-primary" id="new-user-invite-send">[[invite:send-invites]]</button>
		</div>
	</div>
</div>

<div class="panel panel-default">
	<div class="panel-heading"><i class="fa fa-user"></i> [[invite:your-pending-invites-list]]</div>
	<div class="panel-body">
		<div class="h5">[[invite:your-pending-invites-info]]</div>
		<table id="users-container" class="table new-users">
			<thead>
				<th>E-mail</th>
				<th></th>
			</thead>
		</table>
	</div>
</div>

<div class="panel panel-default">
	<div class="panel-heading"><i class="fa fa-user"></i> [[invite:your-accepted-invites-list]]</div>
	<div class="panel-body">
		<div class="h5">[[invite:your-accepted-invites-info]]</div>
		<table id="users-container" class="table new-users">
			<thead>
				<th>E-mail</th>
				<th></th>
			</thead>
		</table>
	</div>
</div>

<style>
	@import url("../../plugins/nodebb-plugin-newuser-invitation/public/templates/admin/plugins/style.css");
</style>
