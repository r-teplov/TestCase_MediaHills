USE rt;

CREATE TABLE IF NOT EXISTS rt.stat_request(
    `status` smallint(5) NOT NULL,
    `body` varchar(500) NOT NULL DEFAULT '',
    `duration` smallint(5) NOT NULL
) ENGINE InnoDB;