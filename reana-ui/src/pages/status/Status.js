/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2021 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { Container, Grid, Icon, Label, Loader } from "semantic-ui-react";
import axios from "axios";

import BasePage from "../BasePage";
import { errorActionCreator } from "~/actions";
import { Title, PieChart } from "~/components";
import { api } from "~/config";
import { healthMapping } from "~/util";

import styles from "./Status.module.scss";

export default function Status() {
  const [status, setStatus] = useState();
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    const getClusterStatus = () => {
      setLoading(true);
      axios({
        method: "get",
        url: api + "/api/status",
        withCredentials: true,
      })
        .then((res) => {
          setStatus(res.data);
          setLoading(false);
        })
        .catch((err) => {
          setStatus({});
          setLoading(false);
          dispatch(errorActionCreator(err));
        });
    };

    getClusterStatus();
  }, [dispatch]);

  const serialize = {
    node: ({ available, unschedulable, ...rest }) => ({
      title: "Nodes",
      details: [`${available} available`, `${unschedulable} unschedulable`],
      ...rest,
    }),
    workflow: ({ running, queued, pending, ...rest }) => ({
      title: "Workflows",
      details: [`${running} running`, `${pending} pending`, `${queued} queued`],
      ...rest,
    }),
    job: ({ running, pending, ...rest }) => ({
      title: "Jobs",
      details: [`${running} running`, `${pending} pending`],
      ...rest,
    }),
    session: ({ active, ...rest }) => ({
      title: "Notebooks",
      details: [`${active} active`],
      ...rest,
    }),
  };

  const pieChartHealthMapping = {
    healthy: "#dbbf2b", // yellow
    warning: "#e5975e", // orange
    critical: "#e55e5e", // red
  };

  const renderPieChart = ({ title, details, percentage, health }) => {
    return (
      <Grid.Column className={styles.column} key={title}>
        <PieChart
          value={percentage}
          totalValue={100}
          fillColor={pieChartHealthMapping[health]}
          backgroundColor="mediumseagreen"
        />
        <div className={styles["status-details"]}>
          <div className={styles.usage}>
            <h3>{title}</h3>
            {details.map((detail, index) => (
              <div key={`${title}-${index}`}>{detail}</div>
            ))}
          </div>

          {percentage !== undefined && (
            <Label
              basic
              size="small"
              color={healthMapping[health]}
              className={styles.percentage}
            >
              {percentage || 0}%
            </Label>
          )}
        </div>
      </Grid.Column>
    );
  };

  return (
    <BasePage>
      <Container text className={styles.container}>
        <Title>
          Cluster Health
          <Icon name="heartbeat" />
        </Title>
        {loading || !status ? (
          <Loader active inline="centered">
            Loading cluster status...
          </Loader>
        ) : (
          <Grid columns={2}>
            {Object.entries(status)
              .sort(([, a], [, b]) => a.sort > b.sort)
              .map(([title, status]) =>
                renderPieChart(serialize[title](status))
              )}
          </Grid>
        )}
      </Container>
    </BasePage>
  );
}
