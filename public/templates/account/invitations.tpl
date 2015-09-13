<div class="panel panel-default">
	<div class="panel-heading"><i class="fa fa-cog"></i> Your Invitations</div>
	<div class="panel-body">
		<div class="form-group col-sm-12">
			<form id="userinvitations">
				<strong>Available invitations:</strong> 10
				<br>
				<strong>Accepted invitations:</strong> 10
				<br>
				<strong>Pending invitations:</strong> 10
			</form>
		</div>
	</div>
</div>
<div class="panel panel-default">
	<div class="panel-heading"><i class="fa fa-envelope-o"></i> [[invite:send-invites]]</div>
	<div class="panel-body">
		<div class="form-group col-sm-12">
			<div class="h5">[[invite:info-emails]]</div>
			<label for="new-user-invite-user">[[invite:emails]]</label>
			<textarea id="new-user-invite-user" class="form-control" placeholder="[[invite:email-placeholder]]"/></textarea>
			<br>
			<button class="btn btn-primary" id="new-user-invite-send">[[invite:send-invites]]</button>
		</div>
	</div>
</div>

<div class="panel panel-default">
	<div class="panel-heading"><i class="fa fa-user"></i> [[invite:invited-users-list]]</div>
	<div class="panel-body">
		<div class="h5">[[invite:info-invited-users-list]]</div>
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
