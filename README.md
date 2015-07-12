# NodeBB New User Invitation

This NodeBB plugin allows forum admins to restrict registration or group membership to only users they invite.

### Usage

The plugin is controlled via the admin page "New User Invitation" under the "Installed Plugins" heading.

![Admin Page](http://puu.sh/iVRRo.png)

Enter the emails of users you wish to invite. CSVs are accepted here, and non-email data is filtered out automagically.

![Invite Example](http://puu.sh/iVSao.png)

The list of invited users is updated whenever a user accepts an invite. You can also resend the invite or uninvite them (Expires the invitation link).

#### Invite Groups (Experimental)

Invite Groups will add newly registered users to the uninvited or invited group. By default, this plugin restricts forum registration to invite-only. By setting either Invite Group, this behaviour will be stopped.

Setting the Uninvited Group will add all new users to that group. They are not automatically removed from this group if invited, and their group is not retroactively changed if you change this setting in the future.

Setting the Invited Group will add users to that group of they are invited and accept the invitation or register.

## Installation

Install via the ACP Install Plugins page, or using the command line with

    npm install nodebb-plugin-newuser-invitation