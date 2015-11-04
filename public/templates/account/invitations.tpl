<div class="panel panel-default">
	<div class="panel-heading"><i class="fa fa-cog"></i> Your Invitations</div>
	<div class="panel-body">
		<div class="form-group col-sm-12">
			<form id="userinvitations">
				<strong>[[invite:user-available-invites, {user.name}]]:</strong> {invitesAvailable}/{maxInvites}
				<br>
				<strong>[[invite:user-pending-invites, {user.name}]]:</strong> {numInvitesPending}
				<br>
				<strong>[[invite:user-accepted-invites, {user.name}]]:</strong> {numInvitesAccepted}
			</form>
		</div>
	</div>
</div>

<!-- IF yourprofile -->
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

<script>
	require(['profile/invitations']);
</script>
<!-- ENDIF yourprofile -->

<div class="panel panel-default">
	<div class="panel-heading"><i class="fa fa-user"></i> [[invite:user-pending-invites-list, {user.name}]]</div>
	<div class="panel-body">
		<div class="h5">[[invite:user-pending-invites-info, {user.name}]]</div>
		<table id="pending-invites" class="table new-users">
			<thead>
				<th>E-mail</th>
				<th></th>
			</thead>
			<!-- BEGIN invitesPending -->
			<tr class="invite">
				<td><span class="email">{invitesPending.email}</span></td>
				<td class="text-right">
					<button class="user-uninvite btn btn-warning">[[invite:uninvite]]</button>
					<button class="user-reinvite btn btn-success">[[invite:resend]]</button>
				</td>
			</tr>
			<!-- END invitesPending -->
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
