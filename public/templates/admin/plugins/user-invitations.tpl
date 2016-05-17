<form id="userinvitations">

	<div class="panel panel-default">
		<div class="panel-heading"><i class="fa fa-cog"></i> [[invite:settings]]</div>
		<div class="panel-body">

			<div id="invitedUsers" data-key="invitedUsers" data-type="inviteArray"></div>

			<div class="checkbox">
				<label for="restrictRegistration">
					<input id="restrictRegistration" data-key="restrictRegistration" name="restrictRegistration" data-type="checkbox" type="checkbox" />
					[[invite:info-restrict]]
				</label>
			</div>

			<br>

			<label for="inviteGroup">
				[[invite:invite-group]]
				<p class="help-block">[[invite:info-invite-group]]</p>
			</label>
			<select id="inviteGroup" data-key="inviteGroup" name="inviteGroup" class="form-control">
				<!-- BEGIN groups -->
				<option value="{groups.name}">{groups.name}</option>
				<!-- END groups -->
			</select>

			<br>

			<label>
				[[invite:default_invitations]]
				<p class="help-block">[[invite:info-default_invitations]]</p>
			</label>
			<input id="defaultInvitations" data-key="defaultInvitations" name="defaultInvitations" class="form-control" type="number" placeholder="10" />

			<br>
		</div>
	</div>

	<div class="panel panel-default">
		<div class="panel-heading"><i class="fa fa-envelope-o"></i> [[invite:title-emails]]</div>
		<div class="panel-body">
			<div class="form-group col-sm-12">
				<label for="new-user-invite-user">[[invite:info-emails]]</label>
				<textarea id="new-user-invite-user" class="form-control" placeholder="[[invite:placeholder-emails]]"/></textarea>
				<br>
				<button type="button" class="btn btn-primary" id="new-user-invite-send">[[invite:button-emails]]</button>
			</div>
		</div>
	</div>

	<div class="panel panel-default">
		<div class="panel-heading"><i class="fa fa-user"></i> [[invite:title-invited]]</div>
		<div class="panel-body">
			<div class="h5">[[invite:info-invited]]</div>
			<table id="pending-invites" class="table new-users">
				<thead>
					<th>[[invite:email]]</th>
					<th></th>
				</thead>
			</table>
		</div>
	</div>

	<div class="panel panel-default">
		<div class="panel-heading"><i class="fa fa-stack-overflow"></i> [[invite:title-bulk]]</div>
		<div class="panel-body">
			<button type="button" class="btn btn-warning" id="bulk-uninvite">[[invite:button-uninvite-all]]</button>
			<button type="button" class="btn btn-success" id="bulk-reinvite">[[invite:button-resend-all]]</button>
		</div>
	</div>

</form>

<style>
	@import url("../../plugins/nodebb-plugin-user-invitations/public/templates/admin/plugins/style.css");
</style>
