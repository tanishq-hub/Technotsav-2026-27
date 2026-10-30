# Deploy GitHub `main` to Vercel through GitHub Actions

This workflow deploys GitHub `main` through the Vercel CLI using the project owner's token. On Vercel Hobby, deployment is still subject to Vercel's commit-author access rule; see section 4. Keep the token and project identifiers in GitHub Actions Secrets, not in the repository.

## 1. Link this checkout to the existing Vercel project

From the repository root, run:

```powershell
npx vercel link
```

Sign in with the Vercel account that owns the project, select the existing `technotsav26-27` project, and let the CLI create its local project link. The `.vercel` directory is ignored by Git.

This Vercel CLI version stores the link in `.vercel/repo.json`. In PowerShell, display only the selected project's name and IDs with:

```powershell
$project = (Get-Content .vercel\repo.json -Raw | ConvertFrom-Json).projects |
  Where-Object name -eq "technotsav26-27"
$project | Select-Object name, id, orgId | Format-List
```

Use these values:

- `orgId` → GitHub secret `VERCEL_ORG_ID`
- `id` → GitHub secret `VERCEL_PROJECT_ID`

The project ID can also be found in Vercel under **Project → Settings → General → Project ID**. Do not paste these IDs into source files.

## 2. Create an owner access token

While signed in to the Vercel account that owns this project, open [Vercel Account Tokens](https://vercel.com/account/settings#tokens), create a token named `technotsav-github-actions`, and scope it to the account/team that owns the project. Copy it once and keep it private.

## 3. Add GitHub Actions Secrets

In the GitHub repository, open **Settings → Secrets and variables → Actions → New repository secret**. Add:

| Secret name | Value |
| --- | --- |
| `VERCEL_TOKEN` | The owner access token from step 2 |
| `VERCEL_ORG_ID` | The `orgId` for `technotsav26-27` from the CLI project link |
| `VERCEL_PROJECT_ID` | The `id` for `technotsav26-27` from the CLI project link |

Keep these as secrets. Do not add them to `.env.example`, a committed file, or a chat message.

## 4. Enable automatic production deploys

The workflow at `.github/workflows/vercel-production.yml` runs on each push to `main`. It pulls the Vercel production environment, builds with the Vercel CLI, and deploys the complete branch to production. It also supports a manual run from **GitHub → Actions → Deploy production to Vercel → Run workflow**.

After the three secrets are saved, push this workflow to `main` (or start it manually). Check **GitHub → Actions** for the run and Vercel **Deployments** for the production result.

Disconnect Vercel's built-in Git integration before enabling this workflow to avoid duplicate deployment attempts. **On the Hobby plan, an owner token does not bypass Vercel's commit-author restriction for private repositories.** A commit authored by someone without Vercel project access can still be blocked when deployed through this workflow, which may leave the CLI waiting on a blocked deployment. To deploy without upgrading, have contributors submit a branch or pull request and have the Vercel project owner merge the changes with an owner-authored commit. Direct contributor-authored commits to `main` require a Vercel plan that supports adding the contributor to the project.

## 5. Revoke or rotate the token

If the token is exposed, revoke it in Vercel Account Tokens and create a replacement. Update the `VERCEL_TOKEN` GitHub secret immediately.
