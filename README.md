# NodeBB New User Invitation

This NodeBB plugin lets admins restrict registration or group membership to only users they invite.

To customise options for this plugin, please consult the "New User Approval" page in the administration panel, under the "Plugins" heading.

By default, registration will be restricted to invite-only. By setting either invitation group, this behaviour will be stopped.

Setting the Uninvited Group will add all new users to that group. They are not automatically removed from this group if invited, and their group is not retroactively changed if you change this setting in the future.

Setting the Invited Group will add users to that group of they are invited and accept the invitation or register.

##Installation

    npm install nodebb-plugin-newuser-invitation