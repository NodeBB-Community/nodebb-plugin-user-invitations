<h1><i class="fa fa-check"></i> [[invite:plugin-title]]</h1><br>

<div class="row">
	<div class="col-lg-9">
		<div class="panel panel-default">
			<div class="panel-heading"><i class="fa fa-envelope-o "></i> [[invite:send-invites]]</div>
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
	</div>
</div>

<div class="row">
	<div class="col-lg-9">
		<div class="panel panel-default">
			<div class="panel-heading"><i class="fa fa-user"></i> [[invite:invited-users-list]]</div>
			<div class="panel-body">
				<div class="h5">[[invite:info-invited-users-list]]</div>
				<table id="users-container" class="table new-users"></table>
			</div>
		</div>
	</div>
	<div class="col-lg-3">
		<div class="panel panel-default">
			<div class="panel-heading">[[invite:bulk-actions]]</div>
			<div class="panel-body">
				<button class="btn btn-warning" id="bulk-uninvite">[[invite:uninvite-all]]</button>
				<button class="btn btn-success" id="bulk-reinvite">[[invite:resend-all]]</button>
			</div>
		</div>
	</div>
</div>

<style>
  @import url("../../plugins/nodebb-plugin-newuser-invitation/public/templates/admin/plugins/style.css");
</style>
