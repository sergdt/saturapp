import './App.css';
import React, { useState, useEffect } from 'react';
import socketIO from 'socket.io-client';
import Lottie from 'react-lottie';
import * as humidly from './lottie/72236-humidly.json'
import * as radiacion from './lottie/60813-radiation-radiacion-uv.json'
import * as temperature from './lottie/97984-cold-temperature.json'
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import { Line } from "react-chartjs-2";
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);


const socket = socketIO.connect('https://santurban.herokuapp.com'); // https://santurban.herokuapp.com

function App() {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [data, setData] = useState(null);
  const [width, setWidth] = React.useState(100);
  const [height, setHeight] = React.useState(100);
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [items, setItems] = useState(null);
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  socket.on('connect', () => {
    setIsConnected(true);
  });

  socket.on('disconnect', () => {
    setIsConnected(false);
  });

  socket.on('message', (data) => {
    console.log(data);
    setData(JSON.parse(data));
  });


  useEffect(() => {
    window.addEventListener("resize", () => {
      if (window.innerWidth < 1250) {
        setWidth(60);
        setHeight(60);
      } else {
        setWidth(100);
        setHeight(100);
      }
    });
  }, [width, height]);

  const extractData = (property) => {
    let result = `Sin datos en ${property}.`;
    const object = data?.uplink_message?.decoded_payload;
    if (object?.hasOwnProperty(property)) {
      result = object[property];
    }
    return result;
  }

  const fetchDataToBackEnd = () =>
    fetch(`https://santurban.herokuapp.com/estadisticas`)
      .then(res => res.json())
      .then(
        (result) => {
          const resultFormat = Object.values(result).map(d => JSON.parse(d));
          console.log(resultFormat);
          setLoading(false);
          setItems(resultFormat);
          handleShow();
        },
        // Note: it's important to handle errors here
        // instead of a catch() block so that we don't swallow
        // exceptions from actual bugs in components.
        // 
        (error) => {
          setLoading(true);
          setError(error);
        }
      )

  return (
    <div className="carrousel-content">
      <div className="information">
        <p>{isConnected ? 'Conectado' : 'No se dectecta una conexión LoraWan'}</p>
        <div className="text-information">
          <Lottie
            options={{
              animationData: humidly
            }}
            height={height} width={width} style={{ margin: 0 }}
          />
          <span className='text'>Humedad: {extractData("Humedad")} % </span>
        </div>
        <div className="text-information">
          <Lottie
            options={{
              animationData: radiacion
            }}
            height={height} width={width} style={{ margin: 0 }}
          />
          <span className='text'>IUV: {extractData("IUV")} </span>
        </div>
        <div className="text-information">
          <Lottie
            options={{
              animationData: temperature
            }}
            height={height} width={width} style={{ margin: 0 }}
          />
          <span className='text'>Temperatura: {extractData("Temperatura")} °C</span>
        </div>
        <div className='chart-container-open'>
          <Button variant="secondary" onClick={fetchDataToBackEnd}>
            Abrir estadísticas
          </Button>
        </div>
        <Modal size="lg" show={show} onHide={handleClose}>
          <Modal.Header closeButton>
            <Modal.Title>estadísticas</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <ChartData datasChart={items}/>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleClose}>
              Cerrar
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </div>
  );
}

const ChartData = ({datasChart}) => {
  const datasets = [];

  datasChart?.map(data => {
    let canContinue = true;
    if(datasets.length > 0 && datasets.find(d => d.label === new Date(data.received_at).toDateString())){
      canContinue = false;
    }

    if(canContinue){
      datasets.push({
        label: new Date(data.received_at).toDateString(),
        data: data?.uplink_message?.decoded_payload ? Object.values(data?.uplink_message?.decoded_payload) : [],
        backgroundColor: [
          "#50AF95",
          "#f3ba2f",
          "#2a71d0"
        ],
        borderColor: "black",
        borderWidth: 2
      })
    }
  });

  const [chartData] = useState({
    labels: datasChart[0]?.uplink_message?.decoded_payload ? Object.getOwnPropertyNames(datasChart[0]?.uplink_message?.decoded_payload) : [],
    datasets
  });

  return (
    <Line
      data={chartData}
      options={{
        plugins: {
          title: {
            display: true,
            text: ""
          },
          legend: {
            display: false
          }
        }
      }}
    />
  )
}

export default App;



