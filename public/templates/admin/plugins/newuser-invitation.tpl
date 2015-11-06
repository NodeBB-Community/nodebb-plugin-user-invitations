<form id="userinvitations">

<div class="row">
	<div class="col-lg-9">
		<div class="panel panel-default">
			<div class="panel-heading"><i class="fa fa-cog"></i> [[user:settings]]</div>
			<div class="panel-body">
				<div class="form-group col-sm-12">
					<div id="invitedUsers" data-key="invitedUsers" data-type="inviteArray"></div>
					<div class="checkbox">
						<label for="restrictRegistration">
							<input id="restrictRegistration" data-key="restrictRegistration" name="restrictRegistration" data-type="checkbox" type="checkbox" />
							<span>Restrict forum registration to invited users only.</span>
						</label>
					</div>
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
					<button type="button" class="btn btn-primary" id="new-user-invite-send">[[invite:send-invites]]</button>
				</div>
			</div>
		</div>
	</div>
</div>

<div class="row">
	<div class="col-lg-9">
		<div class="panel panel-default">
			<div class="panel-heading"><i class="fa fa-user"></i> [[invite:invited-users-list]]</div>
			<div class="panel-body">
				<div class="h5">[[invite:info-invited-users-list]]</div>
				<table id="pending-invites" class="table new-users">
					<thead>
						<th>E-mail</th>
						<th></th>
					</thead>
				</table>
			</div>
		</div>
	</div>
	<div class="col-lg-3">
		<div class="panel panel-default">
			<div class="panel-heading">[[invite:bulk-actions]]</div>
			<div class="panel-body">
				<button type="button" class="btn btn-warning" id="bulk-uninvite">[[invite:uninvite-all]]</button>
				<button type="button" class="btn btn-success" id="bulk-reinvite">[[invite:resend-all]]</button>
			</div>
		</div>
	</div>
</div>

<div class="row">
	<div class="col-lg-12">
		<div class="panel panel-default">
			<div class="panel-heading"><i class="fa fa-cog"></i> [[invite:invite-group]]</div>
			<div class="panel-body">
				<div class="form-group col-sm-12">
					<label for="inviteGroup">[[invite:invite-group]]</label>
					<select id="inviteGroup" data-key="inviteGroup" name="inviteGroup">
						<!-- BEGIN groups -->
						<option value="{groups.name}">{groups.name}</option>
						<!-- END groups -->
					</select>
				</div>
			</div>
		</div>
	</div>
</div>

</form>

<style>
	@import url("../../plugins/nodebb-plugin-newuser-invitation/public/templates/admin/plugins/style.css");
</style>
