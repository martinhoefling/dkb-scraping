#!/usr/bin/env python
import getpass
import logging
import os
from grab import Grab
logging.basicConfig(level=logging.INFO)

LOG = logging.getLogger(__name__)

ARCHIV_URL='https://www.dkb.de/banking/postfach/ordner?$event=gotoFolder&folderNameOrId=archiv'
LEGACY_MESSAGE= 'https://www.dkb.de/DkbTransactionBanking/content/mailbox/Dialogs/ESafe/Details.xhtml?$event=downloadMessage'


def names_and_links(selection):
    names = selection.text_list()
    links = [node.attrib['href'] for node in selection.node_list()]
    return list(zip(names, links))


class DKBGrabber():
    def __init__(self):
        self.g = Grab()

    def login(self, username, pin):
        self.g.go('https://www.dkb.de/banking')
        self.g.doc.set_input('j_username', username)
        self.g.doc.set_input('j_password', pin)
        self.g.doc.submit()
        LOG.info('Login complete')

    def download_archiv(self):
        folders = self._get_folders(ARCHIV_URL)
        for folder in folders:
            if not os.path.exists(folder[0]):
                LOG.info('Creating folder {}'.format(folder[0]))
                os.makedirs(folder[0])
            self._download_documents_in_folder(folder)
        LOG.info('Downloading archive complete')

    def _get_folders(self, base_folder_url):
        self.g.go(base_folder_url)
        selection = self.g.doc.select('//a[@class="evt-gotoFolder"]')
        return names_and_links(selection)[1:]  # First one is link to parent folder

    def _download_documents_in_folder(self, folder):
        page = 1
        self.g.go(folder[1])
        self._download_links(folder[0])
        self.g.go(folder[1])

        # Iterate through all pages
        while self.g.doc.select('//span[@class="pager-navigator-next"]').count():
            next_page_span = self.g.doc.select('//span[@class="pager-navigator-next"]')
            child = next_page_span.node().getchildren()[0]
            target = child.attrib['href']
            page += 1
            self.g.go(target)
            LOG.debug('Switched to page {}'.format(page))
            self._download_links(folder[0])
            self.g.go(target)

    def _download_links(self, folder_name):
        newstyle_attachments = self.g.doc.select('//a[@class="evt-getMailboxAttachment"]')
        oldstyle_attachments = self.g.doc.select('//a[@class="evt-showMessage"]')

        docs = names_and_links(newstyle_attachments)
        for doc in docs:
            self._download_document(doc, folder_name)

        # Old style attachments require an extra step
        old_links = names_and_links(oldstyle_attachments)
        for old_link in old_links:
            self.g.go(old_link[1])
            self._download_document([old_link[0], LEGACY_MESSAGE], folder_name)

    def _download_document(self, document, folder):
        self.g.go(document[1])
        print('downloading document {}'.format(document[0]))
        with open(os.path.join(folder, document[0] + '.pdf'), 'wb') as fh:
            fh.write(self.g.doc.body)

if __name__ == '__main__':
    user = input('DKB User:')
    password = getpass.getpass('DKB Password:')
    g = DKBGrabber()
    g.login(user, password)
    g.download_archiv()
