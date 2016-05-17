<form id="userinvitations">

<div class="panel panel-default">
	<div class="panel-heading"><i class="fa fa-cog"></i> [[invite:title-stats]]</div>
	<div class="panel-body">
		<div class="form-group col-sm-12">
			<strong>[[invite:user-available, {user.name}]]:</strong> <span class="invites-available">{invitesAvailable}</span>/{maxInvites}
			<br>
			<strong>[[invite:user-pending, {user.name}]]:</strong> <span class="invites-pending">{numInvitesPending}</span>
			<br>
			<strong>[[invite:user-accepted, {user.name}]]:</strong> <span class="invites-accepted">{numInvitesAccepted}</span>
		</div>
	</div>
</div>

<!-- IF yourprofile -->
<div class="panel panel-default">
	<div class="panel-heading"><i class="fa fa-envelope-o"></i> [[invite:title-emails]]</div>
	<div class="panel-body">
		<div class="form-group col-sm-12">
			<label for="new-user-invite-user">[[invite:info-emails]]</label>
			<textarea id="new-user-invite-user" class="form-control" placeholder="[[invite:placeholder-emails]]"/></textarea><br>
			<button type="button" class="btn btn-primary" id="new-user-invite-send">[[invite:button-emails]]</button>
		</div>
	</div>
</div>

<script>
	require(['profile/invitations']);
</script>
<!-- ENDIF yourprofile -->

<!-- IF admin -->
<div class="panel panel-default">
	<div class="panel-heading"><i class="fa fa-cog"></i> [[invite:title-stats]]</div>
	<div class="panel-body" id="ui-admin">
		<div class="form-group col-sm-12">
			<label>Set Invitations</label>
			<input type="text" id="set-invites-amount" /><button type="button" id="set-invites">Set</button>
		</div>
		<div class="form-group col-sm-12">
			<label>Give Reward</label>
			<input type="text" id="give-reward-amount" /><button type="button" id="give-reward">Give</button>
		</div>
	</div>
</div>
<!-- ENDIF admin -->

<div class="panel panel-default">
	<div class="panel-heading"><i class="fa fa-user"></i> [[invite:title-invited, {user.name}]]</div>
	<div class="panel-body">
		<div class="h5">[[invite:info-invited, {user.name}]]</div>
		<table id="pending-invites" class="table new-users">
			<thead>
				<th>[[invite:email]]</th>
				<th></th>
			</thead>
			<!-- BEGIN invitesPending -->
			<tr class="invite">
				<td><span class="email">{invitesPending.email}</span></td>
				<td class="text-right">
					<button type="button" class="user-uninvite btn btn-warning">[[invite:button-uninvite]]</button>
					<button type="button" class="user-reinvite btn btn-success">[[invite:button-resend]]</button>
				</td>
			</tr>
			<!-- END invitesPending -->
		</table>
	</div>
</div>

<div class="panel panel-default">
	<div class="panel-heading"><i class="fa fa-user"></i> [[invite:title-accepted, {user.name}]]</div>
	<div class="panel-body">
		<div class="h5">[[invite:info-accepted, {user.name}]]</div>
		<table id="users-container" class="table new-users">
			<tbody>
				<!-- BEGIN invitesAccepted -->
				<tr>
					<td style="width:0px;">
						<span class="topic"><span class="posts"><span class="icon">
						<a href="/user/{invitesAccepted.userslug}">
						<!-- IF invitesAccepted.picture -->
						<img title="{invitesAccepted.username}" class="img-rounded" src="{invitesAccepted.picture}">
						<!-- ELSE -->
						<div class="user-icon" style="background-color: {invitesAccepted.icon:bgColor};" title="{invitesAccepted.username}">{invitesAccepted.icon:text}</div>
						<!-- ENDIF invitesAccepted.picture -->
						</span></span></span>
						</a>
					</td>
					<td style="vertical-align:middle;"><a href="/user/{invitesAccepted.userslug}">{invitesAccepted.username}</a></td>
				</tr>
				<!-- END invitesAccepted -->
			</tbody>
		</table>
	</div>
</div>

</form>

<style>
	@import url("../../plugins/nodebb-plugin-user-invitations/public/templates/admin/plugins/style.css");
</style>
