<form id="userinvitations">

<div class="row">
	<div class="col-lg-9">
		<div class="panel panel-default">
			<div class="panel-heading"><i class="fa fa-cog"></i> [[invite:title-restrict]]</div>
			<div class="panel-body">
				<div class="form-group col-sm-12">
					<div id="invitedUsers" data-key="invitedUsers" data-type="inviteArray"></div>
					<div class="checkbox">
						<label for="restrictRegistration">
							<input id="restrictRegistration" data-key="restrictRegistration" name="restrictRegistration" data-type="checkbox" type="checkbox" />
							<span>[[invite:info-restrict]]</span>
						</label>
					</div>
				</div>
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
	</div>
</div>

<div class="row">
	<div class="col-lg-9">
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
	</div>
	<div class="col-lg-3">
		<div class="panel panel-default">
			<div class="panel-heading">[[invite:title-bulk]]</div>
			<div class="panel-body">
				<button type="button" class="btn btn-warning" id="bulk-uninvite">[[invite:button-uninvite-all]]</button>
				<button type="button" class="btn btn-success" id="bulk-reinvite">[[invite:button-resend-all]]</button>
			</div>
		</div>
	</div>
</div>

<div class="row">
	<div class="col-lg-12">
		<div class="panel panel-default">
			<div class="panel-heading"><i class="fa fa-cog"></i> [[invite:title-invite-group]]</div>
			<div class="panel-body">
				<div class="form-group col-sm-12">
					<label for="inviteGroup">[[invite:info-invite-group]]</label><br>
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
