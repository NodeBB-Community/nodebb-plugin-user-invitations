<div class="panel panel-default">
	<div class="panel-heading"><i class="fa fa-cog"></i> Your Invitations</div>
	<div class="panel-body">
		<div class="form-group col-sm-12">
			<form id="userinvitations">
				<strong>[[invite:user-available-invites, {user.name}]]:</strong> {invites.available}
				<br>
				<strong>[[invite:user-pending-invites, {user.name}]]:</strong> {invites.pending}
				<br>
				<strong>[[invite:user-accepted-invites, {user.name}]]:</strong> {invites.accepted}
			</form>
		</div>
	</div>
</div>

<div class="panel panel-default">
	<div class="panel-heading"><i class="fa fa-user"></i> [[invite:user-pending-invites-list, {user.name}]]</div>
	<div class="panel-body">
		<div class="h5">[[invite:user-pending-invites-info, {user.name}]]</div>
		<table id="users-container" class="table new-users">
			<thead>
				<th>E-mail</th>
				<th></th>
			</thead>
		</table>
	</div>
</div>

<div class="panel panel-default">
	<div class="panel-heading"><i class="fa fa-user"></i> [[invite:user-accepted-invites-list, {user.name}]]</div>
	<div class="panel-body">
		<div class="h5">[[invite:user-accepted-invites-info, {user.name}]]</div>
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
