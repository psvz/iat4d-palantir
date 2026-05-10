## IAT4D integration with Palantir

[![Watch YouTube Tutorial](https://img.shields.io/badge/Watch_Video-FF0000?style=flat&logo=youtube&logoColor=white)](https://youtu.be/w5ohnUb9GXI)

&nbsp;

> Pipeline Builder app

These are static datasets for backing Ontology types.

Add a pipeline, options: Batch, Faster. Load structured data from file `Identity Grid.csv`, all columns are _string_ type. Add output Dataset named **iMarks**. Save and deploy.

Add a pipeline, options: Batch, Faster. Load structured data from file `Secure Trail.csv`. Time is _timestamp_ type, verified is _boolean_, others are _strings_. Add output Dataset named **TapEvents**. Save and deploy.

> Data Connection app

This is a dummy configuration for storing secret material. It will be available run-time from TypeScript functions.

Add new REST API connection named _Keystore_. You have to supply a URL (dummy.com) and create the recommended self-approved egress policy.

In _Additional Secrets_ section add one named `Verifier` with value `tZ1jn8GuySjYxJ3JOwM9jZBB2JY4xkSjZYq/A43kDY8=`
 
Minimal permissions to add: _Enable exports without markings_ and _Allow import in code repos_.

> Ontology Manager app

Create new Object types:
* **iMark**. API name: `imark`. Backing datasource **iMarks** (above). Set both Primary key and Title by _iMark Name_ column.
* **Tap**. API name: `tap`. Backing datasource **TapEvents** (above). Set Primary key by _uuid_ column and Title - by _Tap Guid_. Also, toggle _Allow Edits_ on.

Create new Link Types:
* One-to-many (foreign key). Many side: **Tap** by _iMark Name_. One side: **iMark** by _iMark Name_. This is a relationship reflecting that each iMark can be tapped many times, and Tap is a record for each such event.

**NB** If you have a commercial (not free dev) account with Palantir, it may be a good idea to configure a dataset-level retention policy for Tap, in order to avoid infinite growth as tap-events keep coming in (production).

> New tab **Home** -> **Files** -> **Main Folder** -> **+ New** -> _Code Repository_

Create a repository (TypeScript v2), name it something like _imark-tap-functions_, and open _VS Code_ (it is an in-browser gimmick). In the VS Code you need to add three resources: Object Types **Tap** and **iMark**, and a Source _Keystore_. After that, click `+ Create` to build Ontology SDK and then `Install`.

Add the file `verifyTapPayload.ts` under `functions` folder into the repo. Commit, Tag, and then wait for the checkmark on the Monitored Items box (it can take a minute). On completion, the function appears under Published tab of Functions preview. If you click on it, you can supply an input payload for a dry run:

    {
        "input": {
            "tapGuid": "V5bYZMkH",
            "imarkName": "CE63-AREP-8C88",
            "tapTime": "1774182634.368",
            "signature": "c/qr2rF7xafukOlD5u+ztDYzFc0+0kgT5U8KZnnY2CdLXGLF9NbXff3wfMNq5KbZwWIZ87/ejQBFR7eAcgOHAQ==",
            "tapBy": "ghost"
        }
    }
**NB** The leading four fields are protected through Ed25519 signature. If you change any of those arbitrarily, _Tap Verified_ field of the record being created will become false.

> Ontology Manager app

Back here, go to Action types -> `New Action Type`, select _Function_, name it "Create Tap Record", and select the function/tag tested above in the Rules section. Edit API name of the action to `tap-action`.

Walk back from _Action Types_, in _Ontology Configuration_ copy API name of the Ontology. In my case it is

    ontology-aa66f68e-a331-4075-9b3b-df8bdb4b3e26
Cannot be changed on free dev accounts. We use both API names to construct inbound Rest API URI.

> **Account** -> _Settings_ -> Tokens

Range of authentication options for your real-world apps are available on paid accounts. For simplicity, here we create a standard Bearer token usable with curl/Postman.

> Postman, _Workflow Lineage_ and _Insight_ apps

We can emulate an app-side OSDK call with Postman or curl:

    POST https://<yourFoundryHostname>/api/v2/ontology-aa66f68e-a331-4075-9b3b-df8bdb4b3e26/actions/tap-action/apply
    Content-type: application/json
    Authorization: Bearer <token>
    {
        "parameters": {
            "input": {
                "tapGuid": "R7GyXROl",
                "imarkName": "CE63-AREP-8C88",
                "tapTime": "1778066590.674",
                "signature": "uzSPXH1hGyt/ZPGo311n5oSTTYhkN3bWu/97n3cNPBuxIaoC2/ouZm/GIwbQCSQFxyS738AXNWRND1vAFG1XAQ==",
                "tapBy": "ghost"
            }
        }
    }
_Run History_ at the bottom of Workflow Lineage app keeps debug diagnostics you can inspect if anything goes south. _Insight_ app provides relational view of arriving events from Ontology standpoint.
