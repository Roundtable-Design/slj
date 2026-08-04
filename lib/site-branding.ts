/** Matches the printed course title (no Oxford comma). */
export const COURSE_TITLE = "Simplicity Love & Justice";

export const COURSE_SUBTITLE = "A Discussion Course";

export const COURSE_AUTHOR = "James Odgers";

const MORAL_RIGHTS_LINE =
  "The right of James Odgers to be identified as author of this work has been asserted by him in accordance with the Copyright, Designs and Patents Act 1988.";

const REPRODUCTION_LINE =
  "No part of this publication may be reproduced or transmitted in any form, or by any means, electronic or mechanical, including photocopying, recording, or any information storage and retrieval system, without permission in writing from the publisher.";

const NIV_LINE =
  "Unless otherwise indicated, biblical quotations are from the New International Version © 1973, 1978, 1984 by the International Bible Society. (Inclusive language version 1995, 1996.)";

const ALPHA_LINE =
  "Published originally by: Alpha International, Holy Trinity Brompton, Brompton Road, London SW7 1JA England.";

/** Rolling copyright year for the digital edition notice line. */
export function getCopyrightYear(now: Date = new Date()): number {
  return now.getFullYear();
}

export function getSiteCopyrightLines(now: Date = new Date()): string[] {
  const year = getCopyrightYear(now);
  return [
    `Copyright © James Odgers ${year}. All rights reserved.`,
    MORAL_RIGHTS_LINE,
    `First published in print 2004, reprinted 2006, 2008, updated and republished in print 2025. First published digitally online in ${year}.`,
    REPRODUCTION_LINE,
    NIV_LINE,
    `${ALPHA_LINE} Subsequently published privately by the author.`,
  ];
}

export const DIGITAL_EDITION_NOTICE =
  "This digital edition is published in its entirety under the same copyright. It is for private use by course participants only.";

export const TALKS_FROM_THE_WAREHOUSE_URL = "https://talksfromthewarehouse.co.uk";

export const TALKS_FROM_THE_WAREHOUSE_LABEL = "Talks from the Warehouse";

/** Shared contact for print requests and (planned) replyable course email. */
export const COURSE_INFO_EMAIL = "info@talksfromthewarehouse.co.uk";

export const PRINT_VERSION_MAILTO = `mailto:${COURSE_INFO_EMAIL}?subject=${encodeURIComponent(
  "Request for print version — Simplicity Love & Justice"
)}`;

export const PREFACE_HREF = "/course/04-preface";
